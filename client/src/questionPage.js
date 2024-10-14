import { useState, useEffect } from 'react';
import './index.css';
import axios from 'axios';

const rankIcons = require.context('./rank', true); // Importe les images des rangs


// QuestionPage est la page de quiz de l'application
function QuestionPage (props) {
    
    const [question, setQuestion] = useState(0); // 1 pour la question sur le dénouement du match, 2 pour la question sur les rangs
    const [questionText, setQuestionText] = useState("");
    const [hasAnswered, setHasAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null); // Réponse correcte de la question sur le dénouement du match
    const [correctRank, setCorrectRank] = useState(null); // Réponse correct de la question sur le rang de la partie
    const [rankProximityScore, setRankProximityScore] = useState(null); // Score de proximité de rang

    const [matchData, setMatchData] = useState(null); // Stocke les données du match
    const [summonerSpells, setSummonerSpells] = useState(); // Stocke les données des sorts d'invocateur
    const [queueTypes, setQueueTypes] = useState(null); // Stocke les données des files de jeu
    
    const [selectedTeam, setSelectedTeam] = useState(null); 
    const [selectedRank, setSelectedRank] = useState(null); 
    const [selectedSubRank, setSelectedSubRank] = useState(null);

    const ranks = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum','Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];

    useEffect(() => {
        Promise.all([getSummonerSpells(), getQueueTypes()]).then(() => {
            getQuestion(); // On récupère la question et le match seulement après avoir récupéré les données des sorts d'invocateur et des files de jeu
        });
    }, []);

    useEffect(() => {
        renderMatchInfo(); // On affiche les informations du match seulement après avoir récupéré les données du match
    }, [matchData]);

    // Récupération des données des sorts d'invocateur
    const getSummonerSpells = () => {
        axios.get(`https://ddragon.leagueoflegends.com/cdn/14.7.1/data/en_US/summoner.json`)
        .then(res => { 
            setSummonerSpells(res.data);
        })
        .catch((error) => {
            console.error('Erreur lors de la récupération des données des sorts d\'invocateur:', error);
        })
    }
    // Récupération du sort d'invocateur par sa clé
    const getSummonerSpellParKey = (key) => {
        const summonerData = Object.values(summonerSpells.data);
        return summonerData.find(spell => spell.key === key.toString()).id;
    };

    // Récupération des données des files de jeu
    const getQueueTypes = () => {
        axios.get(`https://static.developer.riotgames.com/docs/lol/queues.json`)	
        .then(res => {
            setQueueTypes(res.data);
        })
        .catch((error) => {
            console.error('Erreur lors de la récupération des données des files de jeu:', error);
        })
    };
    // Récupération de la description de la file de jeu par son ID
    const getQueueTypeById = (queueId) => {
        if (!queueTypes) // On attend que les données des files de jeu soient récupérées
            return null;
        return queueTypes.find(queue => queue.queueId === queueId).description;
    };
    // Récupération du nom de la carte de la file de jeu par son ID
    const getMapById = (mapId) => {
        if (!queueTypes) // On attend que les données des files de jeu soient récupérées
            return null;
        return queueTypes.find(queue => queue.queueId === mapId).map;
    };

    // Fonction pour afficher la question
    const getQuestion = () => {
        setMatchData(null);
        setHasAnswered(false);
        setSelectedTeam(null);
        setSelectedRank(null);
        setIsCorrect(null);
        setSelectedSubRank(null);
        setCorrectRank(null);
        setRankProximityScore(null);

        // On choisit aléatoirement entre les deux questions
        const randomNumber = Math.random();
        if (randomNumber < 0.5) {
            setQuestion(1);
            setQuestionText("Quelle équipe a gagné ?");
        } else {
            setQuestion(2);
            setQuestionText("Quel est le rang moyen de cette partie ?");
        }
        
        // On récupère les données d'un match aléatoire
        axios.get(`${process.env.REACT_APP_API_URL}/api/match/getRandomMatch`)
        .then(res => { 
            console.log("Données du match récupérées :", res.data);
            setMatchData(res.data);
        })
        .catch((error) => {
            console.error('Erreur lors de la récupération des données du match:', error);
        })
    };

    // Fonction pour calculer le temps en minutes et secondes à partir des secondes
    const secondsToMinutes = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secondes = (seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secondes}`;
    };

    // Fonction pour calculer le KDA (Kills/Deaths/Assists) d'un participant
    const calculateKDA = (participant) => {
        const kda = (participant.kills + participant.assists) / participant.deaths;
        const kda2 = kda.toFixed(3);
        return kda2;
    };

    // Fonction pour calculer le nombre de CS (Creep Score) par minute d'un participant
    const csParMinute = (participant) => {
        const csParMinute = participant.totalMinionsKilled / (matchData.info.gameDuration / 60);
        const csParMinute2 = csParMinute.toFixed(1);
        return csParMinute2;
    };

    // Fonction pour afficher les informations du match
    const renderMatchInfo = () => {
        if (!matchData || !matchData.info) { // On attend que les données du match soient récupérées
            return null;
        }

        const { participants, teams } = matchData.info;

        // Calcul de l'or total gagné par chaque équipe
        let goldLeft = 0;
        let goldRight = 0;
        participants.slice(0, 5).map(participant => {
            goldLeft += participant.goldEarned;
        });
        participants.slice(5).map(participant => {
            goldRight += participant.goldEarned;
        });

        return (
            <div>
                <div className="game-info">
                    <h3>{getQueueTypeById(matchData.info.queueId)}</h3>
                    <p>{getMapById(matchData.info.queueId)}</p>
                    <p>{secondsToMinutes(matchData.info.gameDuration)}</p>
                </div>
                <div className="teams-container">
                {teams.map((team, index) => (
                    <div key={team.teamId} className={`team-info ${index % 2 === 0 ? 'left-team' : 'right-team'}`}>
                    <h2>{index === 0 ? 'Equipe bleue' : 'Equipe rouge'}</h2>
                    <p>Baron : {team.objectives.baron.kills}</p>
                    <p>Dragon : {team.objectives.dragon.kills}</p>
                    <p>Kills : {team.objectives.champion.kills}</p>
                    <p>Or : {index === 0 ? goldLeft : goldRight}</p>
                    </div>
                ))}
                </div>

                <div className="participants-container">
                    <div className="left-participants">
                        {renderTeamInfo(participants.slice(0, 5))}
                    </div>
                    <div className="right-participants">
                        {renderTeamInfo(participants.slice(5))}
                    </div>
                </div>
            </div>
        );
    };

    // Fonction pour afficher les informations des participants d'une équipe
    const renderTeamInfo = (participants) => {
        return (<div>
            <div className="legend">
                <span className="kda">KDA</span>
                <span className="degats">Dégâts</span>
                <span className="cs">CS</span>
                <span className="objets">Objets</span>
            </div>
            {participants.map(participant => (
                <div key={participant.summonerId} className="participant-info">
                    <div className="participant-image">
                        <div className="champion">
                            <img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/champion/${participant.championName}.png`} alt={participant.championName} />
                        </div>
                        <div className="summonerSpell">
                            <img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/spell/${getSummonerSpellParKey(participant.summoner1Id)}.png`} alt={participant.spell1Id} />
                            <img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/spell/${getSummonerSpellParKey(participant.summoner2Id)}.png`} alt={participant.spell2Id} />
                        </div>
                    </div>
                    <div className="summonerName">
                        <p><span>{participant.summonerName}</span> <br></br> {question !== 2 ? participant.Rank : null}</p>
                    </div>
                    <p>{participant.kills} / {participant.deaths} / {participant.assists} <br></br> {calculateKDA(participant)}</p>
                    <p>{participant.totalDamageDealt}</p>
                    <p>{participant.totalMinionsKilled} <br></br> {csParMinute(participant)}/min</p>
                    <div className="objects">
                        <div className="top-row">
                        {participant.item0 !== 0 ? 
                            (<img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/item/${participant.item0}.png`} alt={participant.item0} />)
                            : null
                        }
                        {participant.item1 !== 0 ? 
                            (<img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/item/${participant.item1}.png`} alt={participant.item1} />)
                            : null
                        }
                        {participant.item2 !== 0 ? 
                            (<img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/item/${participant.item2}.png`} alt={participant.item2} />)
                            : null
                        }
                        </div>
                        <div className="bottom-row">
                        {participant.item3 !== 0 ? 
                            (<img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/item/${participant.item3}.png`} alt={participant.item3} />)
                            : null
                        }
                        {participant.item4 !== 0 ? 
                            (<img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/item/${participant.item4}.png`} alt={participant.item4} />)
                            : null
                        }
                        {participant.item5 !== 0 ? 
                            (<img src={`https://ddragon.leagueoflegends.com/cdn/14.7.1/img/item/${participant.item5}.png`} alt={participant.item5} />)
                            : null
                        }
                        </div>
                    </div>
                </div>
            ))}
        </div>);
    }

    // Fonction pour gérer la sélection du rang
    const handleRankSelection = (rank) => {
        setSelectedRank(rank); 
        setSelectedSubRank(null);
        const singleSubRankRanks = ['Master', 'Grandmaster', 'Challenger']; // Ces rangs n'ont pas de sous-rangs (seulement I)
        if (singleSubRankRanks.includes(rank)) {
            setSelectedSubRank(`${rank} I`);
        }
    };

    // Fonction pour afficher les boutons des sous-rangs
    const renderSubRankButtons = (rank) => {
        const singleSubRanks = ['Master', 'Grandmaster', 'Challenger']; // Ces rangs n'ont pas de sous-rangs (seulement I)
        if (singleSubRanks.includes(rank)) {
            return null; 
        }

        const subRanks = [ 'I', 'II', 'III', 'IV'];
        return (
            <div className="subranks-container">
                {subRanks.map((subRank, index) => (
                    <button key={index}
                            className={selectedSubRank === `${rank} ${subRank}` ? 'rank-selected' : 'rank'}
                            onClick={() => hasAnswered ? null : setSelectedSubRank(`${rank} ${subRank}`)}>
                        {subRank}
                    </button>
                ))}
            </div>
        );
    };

    // Fonction pour soumettre la réponse
    const handleSubmit = () => {
        setHasAnswered(true);
        if (question === 1) { // Question sur le dénouement du match
            const requestBody = {
                idUser: props.user.ID, 
                idMatch: matchData.metadata.matchId, 
                winningTeamNumber: selectedTeam,
            };
            axios.post(`${process.env.REACT_APP_API_URL}/api/quiz/reponse1`, requestBody)
            .then(response => {
                setIsCorrect(response.data.data.winGuess);
                props.setUser({...props.user, 
                    Experience: props.user.Experience + response.data.data.experienceIncrement,
                    CorrectAnswers: props.user.CorrectAnswers + response.data.data.correctAnswerIncrement, 
                    NbAnswers: props.user.NbAnswers + 1});
                console.log(response.data);
            })
            .catch(error => {
                console.error('Erreur lors de la soumission :', error);
            }); 
        } else if (question === 2) { // Question sur le rang de la partie
            const requestBody = {
                idUser: props.user.ID, 
                idMatch: matchData.metadata.matchId, 
                averageRank: (selectedSubRank || selectedRank).toUpperCase() 
            };
            axios.post(`${process.env.REACT_APP_API_URL}/api/quiz/reponse2`, requestBody)
            .then(response => {
                setCorrectRank(response.data.data.correctRankAnswer);
                setRankProximityScore(response.data.data.rankProximityScore);
                props.setUser({...props.user,
                    Experience: props.user.Experience + response.data.data.experienceIncrement,
                    CorrectAnswers: props.user.CorrectAnswers + response.data.data.correctAnswerIncrement, 
                    NbAnswers: props.user.NbAnswers + 1});
                console.log(response.data);
            })
            .catch(error => {
                console.error('Erreur lors de la soumission :', error);
            }); 
        }      
    };

    return (
        <article>
            <div className="questionBox"> 
                <h1>Question</h1> 
                <h2>{questionText}</h2>
                {renderMatchInfo()}
                <div className="response">
                    {question === 1 ? 
                        hasAnswered ?
                            (<>
                                <button className="finished">Équipe bleue</button>
                                <button className="finished">Équipe rouge</button>
                                {isCorrect !== null ? 
                                    isCorrect ? 
                                        <p>Bonne réponse, cette équipe a bien gagné !</p> 
                                        : 
                                        <p>Mauvaise réponse, cette équipe a perdu !</p>
                                    : null}
                            </>)
                            :
                            (<>
                                <button 
                                    className={selectedTeam === 0 ? "blue-checked" : "blue"}
                                    onClick={() => setSelectedTeam(0)}>Équipe bleue
                                </button>
                                <button 
                                    className={selectedTeam === 1 ? "red-checked" : "red"}
                                    onClick={() => setSelectedTeam(1)}>Équipe rouge
                                </button>
                            </>)
                        : null
                    }
                    {question === 2 ? 
                        (<>
                            <div className="ranks-container">
                                {ranks.map((rank, index) => {
                                    const imagePath = `./${rank}.png`; 
                                    const image = rankIcons(imagePath); 
                                    return (
                                    <img key={index}
                                        src={image}
                                        alt={rank}
                                        className={selectedRank === rank || selectedRank === `${rank} I` ? 'rank-selected' : 'rank'}
                                        onClick={() => hasAnswered ? null : handleRankSelection(rank)}
                                    />
                                    );
                                })}
                            </div>
                            {selectedRank && renderSubRankButtons(selectedRank)}
                            {hasAnswered ? 
                                correctRank != null ?
                                    (<div>
                                        <p>Rang de la partie: {correctRank}</p>
                                        <p>Votre réponse : {selectedSubRank} </p>
                                        <p>Score bonus de proximité de rang : {rankProximityScore}</p>
                                    </div>)
                                    : null
                                : null
                            }
                        </>)
                        : null
                    }
                </div>
                {hasAnswered ? 
                    isCorrect !== null || correctRank != null ? (
                        <>
                            <button className="next" onClick={() => getQuestion()}>Question suivante</button>
                            <button className="next" onClick={() => props.changePage("homePage")}>Retour à l'accueil</button>
                        </>
                        ) : null
                    : 
                    (<button 
                        className={(selectedTeam !== null || (selectedRank !== null && (['Master I', 'Grandmaster I', 'Challenger I'].includes(selectedRank) || selectedSubRank !== null))) ? "next" : "notallowed"}
                        onClick={handleSubmit} 
                        disabled={!(selectedTeam !== null || (selectedRank !== null && (['Master I', 'Grandmaster I', 'Challenger I'].includes(selectedRank) || selectedSubRank !== null)))}>
                            Valider
                    </button>)
                }
            </div>
            
        </article>
    );
	
}

export default QuestionPage;