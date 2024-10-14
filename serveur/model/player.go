package model

// Player représente un joueur de League of Legends
type Player struct {
	ID          string   `json:"id"`
	AccountID   string   `json:"accountId"`
	PUUID       string   `json:"puuid"`
	Pseudo      string   `json:"gameName"`
	Rank        string   `bson:"rank"`
	MatchIDList []string `bson:"matchIDList"`
}

type LeagueEntry struct {
	QueueType string `json:"queueType"`
	Tier      string `json:"tier"`
	Rank      string `json:"rank"`
}
