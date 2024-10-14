package db

import (
	"context"
	"errors"
	"log"
	"os"
	"server/apiRiot"
	"server/model"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// structure de réponse pour la connexion
type LoginResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	UserID  string `json:"userID"`
	Token   string `json:"token,omitempty"`
}

// ================== Fonctions pour les connexions ==================

// se connecte à la base de données MongoDB
func Connect() *mongo.Client {
	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(os.Getenv("MONGODB_URI")))
	if err != nil {
		log.Fatal(err)
	}
	return client
}

// se connecte à la base de données et vérifie les identifiants de l'utilisateur
func Login(client *mongo.Client, username, password string) (LoginResponse, error) {
	coll := client.Database("DB").Collection("users")

	var user model.User
	err := coll.FindOne(context.TODO(), bson.M{"username": username, "password": password}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return LoginResponse{Status: 401, Message: "Identifiants invalides"}, nil
		}
		return LoginResponse{}, err
	}

	log.Printf("Authentification réussie pour l'utilisateur %s\n", user.Username)

	token := time.Now().Format(time.RFC3339) + user.Username
	objID, err := primitive.ObjectIDFromHex(user.ID)
	_, err = coll.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"token": token}},
	)
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{Status: 200, Message: "Authentification réussie", UserID: user.ID, Token: token}, nil
}

// deconnecte l'utilisateur en supprimant le token de la base de données
func DeleteUserToken(client *mongo.Client, userID string) error {
	coll := client.Database("DB").Collection("users")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	_, err = coll.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"token": ""}},
	)
	return err
}

// ================== Fonctions pour User ==================

// InsertUser insère un utilisateur dans la base de données
func InsertUser(client *mongo.Client, user model.User) (*mongo.InsertOneResult, error) {
	log.Println("insertion de l'user dans la bdd")
	coll := client.Database("DB").Collection("users")
	return coll.InsertOne(context.TODO(), user)
}

// UsernameExists vérifie si un nom d'utilisateur existe déjà dans la base de données
func UsernameExists(client *mongo.Client, username string) (bool, error) {
	coll := client.Database("DB").Collection("users")
	count, err := coll.CountDocuments(context.TODO(), bson.M{"username": username})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetAllUsers récupère tous les utilisateurs de la base de données
func GetAllUsers(client *mongo.Client) ([]model.User, error) {
	coll := client.Database("DB").Collection("users")
	ctx := context.TODO()

	cursor, err := coll.Find(ctx, bson.D{{}})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []model.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	return users, nil
}

// GetUserByID recherche un utilisateur par son ID dans la base de données
func GetUserByID(client *mongo.Client, userID string) (model.User, error) {
	var user model.User
	collection := client.Database("DB").Collection("users")

	objID, err := primitive.ObjectIDFromHex(userID) // je convertis l'ID en ObjectID (type de MongoDB)
	if err != nil {
		return user, err // si l'ID n'est pas valide,  retourne une erreur
	}

	err = collection.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&user)
	return user, err
}

// GetUserByToken recherche un utilisateur par son token dans la base de données
func GetUserByToken(client *mongo.Client, token string) (model.User, error) {
	var user model.User
	collection := client.Database("DB").Collection("users")
	log.Println("Recherche de l'utilisateur avec le token: ", token)
	err := collection.FindOne(context.TODO(), bson.M{"token": token}).Decode(&user)
	if err != nil {
		return user, err
	}
	return user, nil
}

// UpdateUserScores met à jour les scores de l'utilisateur
func UpdateUserScores(client *mongo.Client, userId string, correctAnswersIncrement, experienceIncrement int, nbAnswersIncrement int) error {
	coll := client.Database("DB").Collection("users")
	id, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		return err
	}
	_, err = coll.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{
			"$inc": bson.M{
				"correctAnswers": correctAnswersIncrement,
				"experience":     experienceIncrement,
				"nbAnswers":      nbAnswersIncrement,
			},
		},
	)
	return err
}

// SetUserPicture met à jour l'image de profil de l'utilisateur
func SetUserPicture(client *mongo.Client, userId string, picture string) error {
	coll := client.Database("DB").Collection("users")
	id, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		return err
	}
	_, err = coll.UpdateOne(
		context.TODO(),
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"picture": picture}},
	)
	return err
}

// DeleteUser supprime un utilisateur de la base de données
func DeleteUser(client *mongo.Client, userID string) error {
	coll := client.Database("DB").Collection("users")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("Erreur lors de la conversion de l'ID utilisateur en ObjectID : %v\n", err)
		return err
	}

	result, err := coll.DeleteOne(context.TODO(), bson.M{"_id": objID})
	if err != nil {
		log.Printf("Erreur lors de la suppression de l'utilisateur : %v\n", err)
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("aucun utilisateur supprimé")
	}

	log.Printf("Utilisateur supprimé avec succès : %v\n", result.DeletedCount)
	return nil
}

// UpdateUserPseudo met à jour le pseudo de l'utilisateur
func UpdateUserPseudo(client *mongo.Client, userID string, newPseudo string) error {
	coll := client.Database("DB").Collection("users")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("Erreur lors de la conversion de l'ID utilisateur en ObjectID : %v\n", err)
		return err
	}

	result, err := coll.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"pseudo": newPseudo}},
	)
	if err != nil {
		log.Printf("Erreur lors de la mise à jour du pseudo de l'utilisateur : %v\n", err)
		return err
	}

	if result.ModifiedCount == 0 {
		return errors.New("Aucune mise à jour effectuée")
	}

	log.Printf("Pseudo de l'utilisateur mis à jour avec succès. Documents affectés: %v\n", result.ModifiedCount)
	return nil
}

// UpdateUserPassword met à jour le mot de passe de l'utilisateur
func UpdateUserPassword(client *mongo.Client, userID string, newPassword string) error {
	coll := client.Database("DB").Collection("users")
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("Erreur lors de la conversion de l'ID utilisateur en ObjectID : %v\n", err)
		return err
	}

	result, err := coll.UpdateOne(
		context.TODO(),
		bson.M{"_id": objID},
		bson.M{"$set": bson.M{"password": newPassword}},
	)
	if err != nil {
		log.Printf("Erreur lors de la mise à jour du mot de passe de l'utilisateur : %v\n", err)
		return err
	}

	if result.ModifiedCount == 0 {
		return errors.New("Aucune mise à jour effectuée")
	}

	log.Printf("Mot de passe de l'utilisateur mis à jour avec succès. Documents affectés: %v\n", result.ModifiedCount)
	return nil
}

// ================== Fonctions pour Player ==================

// InsertPlayer insère un joueur dans la base de données
func InsertPlayer(client *mongo.Client, player model.Player) (*mongo.InsertOneResult, error) {
	coll := client.Database("DB").Collection("players")
	return coll.InsertOne(context.TODO(), player)
}

// GetPlayerByID renvoie un joueur aléatoire de la base de données
func GetRandomPlayer(client *mongo.Client) (model.Player, error) {
	var player model.Player
	coll := client.Database("DB").Collection("players")
	pipeline := mongo.Pipeline{ // pipeline pour récupérer un joueur aléatoire
		{{Key: "$sample", Value: bson.D{{Key: "size", Value: 1}}}},
	}
	cursor, err := coll.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return player, err
	}
	if cursor.Next(context.TODO()) {
		err := cursor.Decode(&player)
		return player, err
	}
	return player, mongo.ErrNoDocuments
}

// UpdatePlayerMatchesByID met à jour les matchs d'un joueur
func UpdatePlayerMatchesByID(client *mongo.Client, playerID string, matches []string) error {
	coll := client.Database("DB").Collection("players")
	// Mise à jour du MatchIDList du joueur
	result, err := coll.UpdateOne(
		context.TODO(),
		bson.M{"_id": playerID},
		bson.M{"$set": bson.M{"matchIDList": matches}},
	)
	if err != nil {
		log.Printf("Erreur lors de la mise à jour du joueur: %v\n", err)
		return err
	}

	log.Printf("Documents affectés: %v pour le joueur %v\n", result.ModifiedCount, playerID)

	return nil
}

// GetAllPlayers récupère tous les joueurs de la base de données
func GetAllPlayers(client *mongo.Client) ([]model.Player, error) {
	var players []model.Player
	coll := client.Database("DB").Collection("players")
	cursor, err := coll.Find(context.TODO(), bson.M{})
	if err != nil {
		return nil, err
	}
	if err = cursor.All(context.TODO(), &players); err != nil {
		return nil, err
	}
	return players, nil
}

// ================== Fonctions pour Match ==================

// MatchExists vérifie si un match existe déjà dans la base de données
func MatchExists(client *mongo.Client, matchID string) (bool, error) {
	coll := client.Database("DB").Collection("matchs")
	count, err := coll.CountDocuments(context.TODO(), bson.M{"metadata.matchid": matchID})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// InsertMatch insère un match dans la base de données
func InsertMatch(client *mongo.Client, match model.Match) (*mongo.InsertOneResult, error) {
	coll := client.Database("DB").Collection("matchs")
	result, err := coll.InsertOne(context.TODO(), match)
	if err != nil {
		log.Println("Erreur lors de l'insertion du match:", err)
		return nil, err
	}
	return result, nil
}

// parcours de la liste des matchsID de chaque player et actualise le premier match non présent
func UpdateMatches(client *mongo.Client, apiKey string) {
	players, err := GetAllPlayers(client)
	if err != nil {
		log.Println("Erreur lors de la récupération de tous les joueurs :", err)
		return
	}

	PlayersLoop:
	for _, player := range players {
		for _, matchID := range player.MatchIDList {
			exists, err := MatchExists(client, matchID)
			if err != nil {
				log.Println("Erreur lors de la vérification de l'existence du match :", err)
				continue
			}
			if !exists { // si le match n'existe pas dans la base de données, on le récupère
				matchDetails, err := apiRiot.FetchMatch(matchID, apiKey)
				if err != nil {
					log.Printf("Erreur lors de la récupération des détails du match %s : %s\n", matchID, err)
					break PlayersLoop
				}
				// Mise à jour du rank pour chaque participant
				for i, participant := range matchDetails.Info.Participants {
					rank, err := apiRiot.FetchRank(participant.SummonerId, apiKey)
					if err != nil {
						log.Printf("Erreur lors de la récupération du rank pour le SummonerId %s : %s\n", participant.SummonerId, err)
						continue
					}
					matchDetails.Info.Participants[i].Rank = rank
				}

				_, err = InsertMatch(client, matchDetails)
				if err != nil {
					log.Printf("Erreur lors de l'insertion des détails du match %s dans la base de données : %s\n", matchID, err)
					break PlayersLoop
				}

				log.Printf("Match %s ajouté à la BDD.\n", matchID)
				break PlayersLoop
			}
		}
	}
}

// renvoie un match aléatoire de la base de données
func GetRandomMatch(client *mongo.Client) (model.Match, error) {
	var match model.Match
	coll := client.Database("DB").Collection("matchs")
	pipeline := mongo.Pipeline{ // pipeline pour récupérer un match aléatoire
		{{Key: "$sample", Value: bson.D{{Key: "size", Value: 1}}}},
	}
	cursor, err := coll.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return match, err
	}
	if cursor.Next(context.TODO()) {
		err := cursor.Decode(&match)
		return match, err
	}
	return match, mongo.ErrNoDocuments
}

// FindMatchById renvoie un match a partir de son ID
func FindMatchById(client *mongo.Client, matchId string) (*model.Match, error) {
	var match model.Match
	coll := client.Database("DB").Collection("matchs")

	objID, err := primitive.ObjectIDFromHex(matchId)
	if err == nil {
		err = coll.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&match)
		if err == nil {
			return &match, nil
		}
	}
	err = coll.FindOne(context.TODO(), bson.M{"metadata.matchid": matchId}).Decode(&match)
	if err != nil {
		return nil, err
	}
	return &match, nil
}

// ================== Fonctions pour reset ==================

// supprime tous les joueurs de la base de données
func RemoveAllPlayers(client *mongo.Client) error {
	coll := client.Database("DB").Collection("players")
	_, err := coll.DeleteMany(context.TODO(), bson.M{})
	return err
}

// supprime tous les matchs de la base de données
func RemoveAllMatchs(client *mongo.Client) error {
	coll := client.Database("DB").Collection("matchs")
	_, err := coll.DeleteMany(context.TODO(), bson.M{})
	return err
}
