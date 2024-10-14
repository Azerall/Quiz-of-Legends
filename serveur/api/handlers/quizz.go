package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"server/db"
	"server/model"
	"sort"
)

// gère la réponse à la question 1 du quiz (déterminer l'équipe gagnante)
func Reponse1(w http.ResponseWriter, r *http.Request) {
	var quizResp model.QuizResponse
	if err := json.NewDecoder(r.Body).Decode(&quizResp); err != nil {
		json.NewEncoder(w).Encode(model.ApiResponse{Status: http.StatusBadRequest, Message: "Invalid request body"})
		return
	}

	client := db.Connect()
	defer client.Disconnect(context.TODO())

	match, err := db.FindMatchById(client, quizResp.IdMatch)
	if err != nil {
		log.Printf("Error finding match: %v\n", err)
		json.NewEncoder(w).Encode(model.ApiResponse{Status: http.StatusNotFound, Message: "Match not found"})
		return
	}

	correctAnswersIncrement := 0
	experienceIncrement := 1
	nbAnswersIncrement := 1

	if match.Info.Teams[quizResp.WinningTeamNumber].Win {
		experienceIncrement += 10
		correctAnswersIncrement++
	}
	err = db.UpdateUserScores(client, quizResp.IdUser, correctAnswersIncrement, experienceIncrement, nbAnswersIncrement)
	if err != nil {
		log.Printf("Error updating user scores: %v\n", err)
		json.NewEncoder(w).Encode(model.ApiResponse{Status: http.StatusInternalServerError, Message: "Failed to update user scores"})
		return
	}

	data := map[string]interface{}{
		"winGuess": match.Info.Teams[quizResp.WinningTeamNumber].Win,
		"experienceIncrement": experienceIncrement,
		"correctAnswerIncrement": correctAnswersIncrement,
	}

	json.NewEncoder(w).Encode(model.ApiResponse{Status: http.StatusOK, Message: "Quiz response processed", Data: data})
}

// gère la réponse à la question 2 du quiz (déterminer le rang moyen des joueurs)
func Reponse2(w http.ResponseWriter, r *http.Request) {
	var quizResp model.QuizResponse
	if err := json.NewDecoder(r.Body).Decode(&quizResp); err != nil {
		json.NewEncoder(w).Encode(model.ApiResponse{Status: http.StatusBadRequest, Message: "Invalid request body"})
		return
	}

	client := db.Connect()
	defer client.Disconnect(context.TODO())

	match, err := db.FindMatchById(client, quizResp.IdMatch)
	if err != nil {
		log.Printf("Error finding match: %v\n", err)
		json.NewEncoder(w).Encode(model.ApiResponse{Status: http.StatusNotFound, Message: "Match not found"})
		return
	}
	println(quizResp.AverageRank)
	var ranks []int
	for _, participant := range match.Info.Participants {
		if participant.Rank != "" && participant.Rank != "Unranked" {
			ranks = append(ranks, rankToValue(participant.Rank))
		}
	}

	// Calcule le rang median des joueurs de la partie
	sort.Ints(ranks)
	medianRankValue := 0
	if len(ranks) > 0 {
		middle := len(ranks) / 2
		medianRankValue = ranks[middle]
		if len(ranks)%2 == 0 {
			medianRankValue = (medianRankValue + ranks[middle-1]) / 2
		}
	}

	correctAnswersIncrement := 0
	experienceIncrement := 1
	nbAnswersIncrement := 1

	if abs(medianRankValue-rankToValue(quizResp.AverageRank)) < 5 {
		experienceIncrement += 10
		correctAnswersIncrement++
	} else {
		experienceIncrement += max(0, 10-(abs(medianRankValue-rankToValue(quizResp.AverageRank))/2))
	}
	err = db.UpdateUserScores(client, quizResp.IdUser, correctAnswersIncrement, experienceIncrement, nbAnswersIncrement)
	if err != nil {
		log.Printf("Error updating user scores: %v\n", err)
		json.NewEncoder(w).Encode(model.ApiResponse{Status: http.StatusInternalServerError, Message: "Failed to update user scores"})
		return
	}

	data := map[string]interface{}{
		"rankGuess":          abs(medianRankValue-rankToValue(quizResp.AverageRank)) < 5,
		"rankProximityScore": max(0, 10-abs(medianRankValue-rankToValue(quizResp.AverageRank))),
		"correctRankAnswer":  ValueToRank(medianRankValue),
		"experienceIncrement": experienceIncrement,
		"correctAnswerIncrement": correctAnswersIncrement,
	}

	json.NewEncoder(w).Encode(model.ApiResponse{Status: http.StatusOK, Message: "Quiz response processed", Data: data})
}

// Fonction pour convertir les rangs en numéros pour le calcul de la médiane
func rankToValue(rank string) int {
	rankValues := map[string]int{
		"IRON IV":       1,
		"IRON III":      2,
		"IRON II":       3,
		"IRON I":        4,
		"BRONZE IV":     5,
		"BRONZE III":    6,
		"BRONZE II":     7,
		"BRONZE I":      8,
		"SILVER IV":     9,
		"SILVER III":    10,
		"SILVER II":     11,
		"SILVER I":      12,
		"GOLD IV":       13,
		"GOLD III":      14,
		"GOLD II":       15,
		"GOLD I":        16,
		"PLATINUM IV":   17,
		"PLATINUM III":  18,
		"PLATINUM II":   19,
		"PLATINUM I":    20,
		"EMERALD IV":    21,
		"EMERALD III":   22,
		"EMERALD II":    23,
		"EMERALD I":     24,
		"DIAMOND IV":    25,
		"DIAMOND III":   26,
		"DIAMOND II":    27,
		"DIAMOND I":     28,
		"MASTER I":      29,
		"GRANDMASTER I": 30,
		"CHALLENGER I":  31,
	}
	value, exists := rankValues[rank]
	if exists {
		return value
	}
	return 0
}

// Fonction pour convertir les numéros des rangs en string
func ValueToRank(value int) string {
	rankValues := map[int]string{
		1:  "Iron IV",
		2:  "Iron III",
		3:  "Iron II",
		4:  "Iron I",
		5:  "Bronze IV",
		6:  "Bronze III",
		7:  "Bronze II",
		8:  "Bronze I",
		9:  "Silver IV",
		10: "Silver III",
		11: "Silver II",
		12: "Silver I",
		13: "Gold IV",
		14: "Gold III",
		15: "Gold II",
		16: "Gold I",
		17: "Platinum IV",
		18: "Platinum III",
		19: "Platinum II",
		20: "Platinum I",
		21: "Emerald IV",
		22: "Emerald III",
		23: "Emerald II",
		24: "Emerald I",
		25: "Diamond IV",
		26: "Diamond III",
		27: "Diamond II",
		28: "Diamond I",
		29: "Master",
		30: "Grand Master",
		31: "Challenger",
	}
	rank, exists := rankValues[value]
	if exists {
		return rank
	}
	return "Unranked"
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
