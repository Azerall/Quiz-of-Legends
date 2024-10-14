package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"server/db"
	"server/model"
)

// retourne un match aléatoire
func GetRandomMatch(w http.ResponseWriter, r *http.Request) {
	log.Println("Réception d'une requête GET sur /getRandomMatch")
	if r.Method != http.MethodGet {
		http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		return
	}

	client := db.Connect()
	defer client.Disconnect(context.TODO())

	var match model.Match
	match, err := db.GetRandomMatch(client)
	if err != nil {
		http.Error(w, "Erreur lors de la récupération d'un match aléatoire", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(match)
}
