package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"server/api"
	"server/apiRiot"
	"server/db"
	"time"
	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Erreur lors du chargement du fichier .env")
	}

	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		log.Fatal("Pas de variable d'environnement MONGODB_URI fournie")
	}

	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		log.Fatal("Pas de variable d'environnement API_KEY fournie")
	}

	api.ConfigureRoutes()
	log.Println("Server starting on port 8080...")
	router := api.ConfigureRoutes()

	client := db.Connect()

	defer client.Disconnect(context.TODO())

	// Récupération des joueurs à partir de la liste des joueurs par défaut contenue dans l'environnement
	playerList := os.Getenv("PLAYER_LIST")
	if playerList == "" {
		log.Fatal("Pas de variable d'environnement PLAYER_LIST fournie")
	}
	//pseudoTagList := strings.Split(playerList, ",")
	//resetAndStock(client, apiKey, pseudoTagList)

	// Mise à jour des données de maniere periodique
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			Update(client, apiKey)
		}
	}()

	// Pour éviter les problèmes de CORS
	corsOpts := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Accept", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"}),
		handlers.AllowCredentials(),
	)
	//db.RemoveAllMatchs(client)
	if err := http.ListenAndServe("0.0.0.0:8080", corsOpts(router)); err != nil {
		log.Fatalf("Error starting server: %s\n", err)
	}

}

// Réinitialiser la base de données et stocker les joueurs à partir de la liste des pseudos
func resetAndStock(client *mongo.Client, apiKey string, pseudoTagList []string) {
	// Réinitialiser la base de données
	err := db.RemoveAllPlayers(client)
	if err != nil {
		log.Printf("Erreur lors de la réinitialisation des joueurs : %s\n", err)
		return
	}
	err = db.RemoveAllMatchs(client)
	if err != nil {
		log.Printf("Erreur lors de la réinitialisation des matchs : %s\n", err)
		return
	}

	// Stocker les données des nouveaux joueurs
	for _, pseudoTag := range pseudoTagList {
		player, err := apiRiot.FetchPlayer(pseudoTag, apiKey)
		if err != nil {
			log.Printf("Erreur lors de la récupération du joueur %s : %s\n", pseudoTag, err)
			return
		}

		_, err = db.InsertPlayer(client, player)
		if err != nil {
			log.Printf("Erreur lors de l'insertion du joueur %s : %s\n", pseudoTag, err)
			return
		}
	}
}

// Mise à jour des données à partir de l'API RIOT toutes les minutes
func Update(client *mongo.Client, apiKey string) {
	log.Printf("=====================================")
	log.Println("Mise à jour des données...")

	player, err := db.GetRandomPlayer(client)

	if err != nil {
		log.Println("Erreur lors de la récupération d'un joueur aléatoire :", err)
		return
	}
	err = apiRiot.FetchPlayerMatches(&player, apiKey)
	if err != nil {
		log.Println("Erreur lors de la récupération des matchs :", err)
		return
	}
	//log.Print("Nombre de matchs récupérés : ", len(matches))

	err = db.UpdatePlayerMatchesByID(client, player.ID, player.MatchIDList)
	if err != nil {
		log.Printf("Erreur lors de la mise à jour des matchs du joueur : %s\n", err)
	}
	log.Printf("Mise à jour réussie pour le joueur %s\n", player.Pseudo)
	log.Printf("=====================================")
	log.Printf("Debut mise à jour Match...")
	db.UpdateMatches(client, apiKey)
	log.Printf("Fin mise à jour Match ")
	log.Printf("=====================================")

}
