import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './login';
import Signin from './signin';
import HomePage from './homePage';
import QuestionPage from './questionPage';
import ProfilPage from './profilPage';
import Parametres from './parameters'
import LeaderBoard from './LeaderBoard';
import './index.css';


// MainPage est le composant principal de l'application qui regroupe toutes les pages et gère le changement entre elles.
// Elle s'occupe de récupérer et stocker les données nécessaires pour les différentes pages.
function MainPage (props) {
  
  const [page, setPage] = useState("loginPage"); // La première page affichée est la page de connexion
  
  const [isConnected, setConnect] = useState(false); // Etat pour savoir si l'utilisateur est connecté
  const [user, setUser] = useState(null); // Utilisateur connecté
  const [userProfil, setUserProfil] = useState(null); // Utilisateur dont on consulte le profil

  useEffect(() => {
    getConnected();  
  } , []);

  // Fonction pour vérifier si l'utilisateur est connecté via un token stocké localement
  const getConnected = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log("Aucun token trouvé.");
        setConnect(false);
        return;
    }

    axios.get(`${process.env.REACT_APP_API_URL}/api/user/getUserToken`, {
        headers: {
            Authorization: `${token}`
        }
    })
    .then(res => {
        console.log("Utilisateur connecté récupéré :", res.data);
        setUser(res.data); 
        setConnect(true);
        changePage("homePage");
    })
    .catch((error) => {
        console.log("Erreur lors de la récupération de l'utilisateur avec le token :", error);
        setConnect(false);
    });
  }

  // Fonction pour déconnecter l'utilisateur
  const setLogout = () => {
    setConnect(false);
    setPage("loginPage");
    if (user != null) {
      axios.post(`${process.env.REACT_APP_API_URL}/api/user/logout/${user.ID}`)
      .then(res => { 
        localStorage.removeItem("authToken");
        console.log("Déconnexion réussie.");
      })
      .catch((error) => {
        console.log("Erreur lors de la déconnexion :", error);
      })
    }
  }
  
  // Fonction pour récupérer tous les utilisateurs pour le leaderboard
  const getAllUsers = (callback) => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/user/getall/`)
    .then(res => { 
      callback(res.data)
    })
    .catch((error) => {
      console.log(error);
    })
  }

  // Fonction pour changer de page
  const changePage = (page) => {
    setPage(page);
  }

  // Fonction pour calculer le niveau en utilisant une fonction logarithmique
  const calculateLevel = (experience) => {
    const level = Math.max(1, Math.floor(2 * Math.log(experience) - 4));
    return level;
  }   

  return (
    <div>
      {isConnected ? 
        <header>
        <div className="entetesite">
            <div className="deconnexion" onClick={() => setLogout()}>Déconnexion</div>
            <div className="titre" onClick={() => changePage("homePage")}>Quiz of Legends</div>
            <div className="profil" onClick={() => {setUserProfil(user); changePage("profilPage")}}>Profil</div>
        </div>
      </header>
      : ""}
      
      <main>
        { page==="loginPage"? <Login login={getConnected} changePage={changePage}/> : "" }
        { page==="signinPage"? <Signin changePage={changePage}/> : "" }
        { page==="homePage"? <HomePage user={user} changePage={changePage} getAllUsers ={getAllUsers} setUserProfil={setUserProfil} calculateLevel={calculateLevel}/> : "" }
        { page==="questionPage"? <QuestionPage user={user} changePage={changePage} setUser={setUser}/> : "" }
        { page==="leaderBoard"? <LeaderBoard changePage={changePage} getAllUsers ={getAllUsers} tinyVersion={false} calculateLevel={calculateLevel} setUserProfil={setUserProfil}/>: ""}
        { page==="profilPage"? <ProfilPage user={userProfil} setUser={setUser} isMe={user.ID === userProfil.ID} calculateLevel={calculateLevel}/> : "" }
        { page==="parametres"? <Parametres user={user} setUser={setUser} logout={setLogout}/> : "" }
      </main>

    </div>
  );
}

export default MainPage;
