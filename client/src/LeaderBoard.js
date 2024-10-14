import { useState, useEffect } from 'react'
import './index.css';


// LeaderBoard affiche le classement des utilisateurs.
function LeaderBoard (props) {
    const [users, setUsers] = useState([]); // Stocke la liste des utilisateurs

    const tinyVersion = props.tinyVersion; // Indique si le classement est dans sa version réduite ou non pour l'affichage sur la page d'accueil

    useEffect(() => {
        const users = (usersData) => {
            const sortedUsers = [...usersData].sort((a, b) => b.Experience - a.Experience); // On trie les utilisateurs par expérience décroissante
            setUsers(sortedUsers);
        };
        props.getAllUsers(users); 
    }, [props.getAllUsers]);

    return (
        <div>
            { tinyVersion ? ( // Si on est sur la page d'accueil, on affiche seulement les 3 premiers utilisateurs
                <div className="side-leaderboard"> 
                    <div onClick={() => props.changePage("leaderBoard")}>
                        <h1>Leader Board</h1>
                    </div>
                    {users.slice(0, 3).map((user, index) => (
                        <p key={user.Username} onClick={() => { props.setUserProfil(user); props.changePage("profilPage"); }} >
                            {index + 1}. {user.Pseudo} (Niv. {props.calculateLevel(user.Experience)})
                        </p>
                    ))}
                </div>)
                :
                (<div className="leader-board">
                    <div onClick={() => props.changePage("leaderBoard")}>
                        <h1>Leader Board</h1>
                    </div>
                    {users.map((user, index) => (
                        <p key={user.Username} onClick={() => { props.setUserProfil(user); props.changePage("profilPage"); }} >
                            {index + 1}. {user.Pseudo} (Niv. {props.calculateLevel(user.Experience)}) - 
                            Précision : {user.NbAnswers > 0 ? ((user.CorrectAnswers / user.NbAnswers) * 100).toFixed(2) : (0).toFixed(2)}%
                        </p>
                    ))}
                </div>)
            }
        </div>
    );
}
export default LeaderBoard;
