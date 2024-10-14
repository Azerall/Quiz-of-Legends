package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"server/db"
	"server/model"
)

// CreatePlayerHandler gère la création d'un nouveau joueur
func CreatePlayerHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Réception d'une requête PUT sur /createPlayer")
	if r.Method != http.MethodPut {
		http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		return
	}

	var newPlayer model.Player
	if err := json.NewDecoder(r.Body).Decode(&newPlayer); err != nil {
		http.Error(w, "Erreur lors du décodage de la requête", http.StatusBadRequest)
		return
	}

	log.Println(newPlayer)

	client := db.Connect()

	defer client.Disconnect(context.TODO())

	result, err := db.InsertPlayer(client, newPlayer)
	if err != nil {
		http.Error(w, "Erreur lors de l'insertion du joueur", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}
