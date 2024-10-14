package model

// QuizResponse représente la réponse envoyée par l'utilisateur pour le quiz
type QuizResponse struct {
	IdUser            string `json:"idUser"`
	IdMatch           string `json:"idMatch"`
	WinningTeamNumber int    `json:"winningTeamNumber"`
	AverageRank       string `json:"averageRank"`
}
