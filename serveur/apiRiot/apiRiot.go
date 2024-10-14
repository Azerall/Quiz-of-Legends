package apiRiot

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"server/model"
)

// Fait une requête HTTP à l'API de RIOT
func makeRequest(method, url, apiKey string) (*http.Response, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		log.Println("Erreur lors de la création de la requête HTTP avec", url, ":", err)
		return nil, err
	}
	req.Header.Set("X-Riot-Token", apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println("Erreur lors de l'appel à l'API externe avec", url, ":", err)
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		log.Printf("Réponse non réussie de l'API avec", url, ": Code de statut %d\n", resp.StatusCode)
		return nil, err
	}
	return resp, nil
}

// Récupère les informations d'un joueur depuis l'API de RIOT
func FetchPlayer(pseudoTag string, apiKey string) (model.Player, error) {
	var player model.Player

	// Récupération du PUUID à partir du pseudo et du tag
	url := "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/" + pseudoTag

	resp, err := makeRequest("GET", url, apiKey)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("FetchPlayer : Erreur lors de la lecture du corps de la réponse : %v\n", err)
		return player, err
	}

	err = json.Unmarshal(body, &player)
	if err != nil {
		log.Printf("FetchPlayer : Erreur lors du décodage JSON de la réponse : %v\n", err)
		return player, err
	}

	// Récupération des données du joueur avec le PUUID
	url = "https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/" + player.PUUID

	resp, err = makeRequest("GET", url, apiKey)

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("FetchPlayer : Erreur lors de la lecture du corps de la réponse : %v\n", err)
		return player, err
	}

	err = json.Unmarshal(body, &player)
	if err != nil {
		log.Printf("FetchPlayer : Erreur lors du décodage JSON de la réponse : %v\n", err)
		return player, err
	}

	// Récupération du rank du joueur
	rank, err := FetchRank(player.ID, apiKey)
	if err != nil {
		log.Printf("FetchPlayer : Erreur lors de la récupération du rank du joueur %s : %v\n", pseudoTag, err)
		return player, err
	}
	player.Rank = rank

	// Récupération des matchs du joueur
	err = FetchPlayerMatches(&player, apiKey)
	if err != nil {
		log.Printf("FetchPlayer : Erreur lors de la récupération des matchs du joueur %s : %v\n", pseudoTag, err)
		return player, err
	}

	log.Printf("Joueur %s récupérés depuis l'API RIOT\n", pseudoTag)
	return player, nil
}

// Met à jour le rank d'un joueur depuis l'API de RIOT
func FetchRank(id string, apiKey string) (string, error) {
	url := "https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/" + id

	resp, err := makeRequest("GET", url, apiKey)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("FetchRank : Erreur lors de la lecture du corps de la réponse :", err)
		return "", err
	}

	var leagueEntries []model.LeagueEntry
	err = json.Unmarshal(body, &leagueEntries)
	if err != nil {
		log.Println("FetchRank : Erreur lors du décodage JSON de la réponse :", err)
		return "", err
	}

	// On récupère l'entrée où queueType est égale à "RANKED_SOLO_5x5"
	for _, entry := range leagueEntries {
		if entry.QueueType == "RANKED_SOLO_5x5" {
			newRank := entry.Tier + " " + entry.Rank
			return newRank, nil
		}
	}

	// Si aucune entrée avec la queueType "RANKED_SOLO_5x5" n'est trouvée, alors le joueur n'a pas de rank
	return "", nil
}

// Fait une requête à l'API RIOT pour mettre à jour les derniers matchs d'un joueur
func FetchPlayerMatches(player *model.Player, apiKey string) error {
	url := "https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/" + player.PUUID + "/ids?type=ranked&start=0&count=3"

	resp, err := makeRequest("GET", url, apiKey)

	var matches []string
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("FetchPlayerMatches : Erreur lors de la lecture du corps de la réponse :", err)
		return err
	}

	err = json.Unmarshal(body, &matches)
	if err != nil {
		log.Println("FetchPlayerMatches : Erreur lors du décodage JSON de la réponse :", err)
		return err
	}

	player.MatchIDList = matches

	return nil
}

// Récupère les détails d'un match depuis l'API de RIOT à partir de son ID
func FetchMatch(matchID string, apiKey string) (model.Match, error) {
	var match model.Match
	url := "https://europe.api.riotgames.com/lol/match/v5/matches/" + matchID

	resp, err := makeRequest("GET", url, apiKey)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("FetchMatch : Erreur lors de la lecture du corps de la réponse : %v\n", err)
		return match, err
	}

	err = json.Unmarshal(body, &match)
	if err != nil {
		log.Printf("FetchMatch : Erreur lors du décodage JSON de la réponse : %v\n", err)
		return match, err
	}

	log.Printf("Match %s récupérés depuis l'API RIOT\n", matchID)
	return match, nil
}
