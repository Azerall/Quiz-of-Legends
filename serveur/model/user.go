package model

// User représente un utilisateur de l'application
type User struct {
	ID             string `bson:"_id,omitempty"`
	Pseudo         string `bson:"pseudo"`
	Username       string `bson:"username"`
	Password       string `bson:"password"`
	Token          string `bson:"token"`
	Experience     int    `bson:"experience"`
	CorrectAnswers int    `bson:"correctAnswers"`
	NbAnswers      int    `bson:"nbAnswers"`
	Picture		   string `bson:"picture"`
}
