import './index.css';
import SearchBar from './searchBar'
import LeaderBoard from './LeaderBoard'


// HomePage affiche la page d'accueil de l'application.
// Elle comprend une barre de recherche (SearchBar), une version miniature du classement des utilisateurs (LeaderBoard), un bouton pour accéder au quiz et un accès aux paramètres.
function HomePage (props) {
    
    return (
        <div>
            <SearchBar changePage ={props.changePage} getAllUsers ={props.getAllUsers} setUserProfil={props.setUserProfil} calculateLevel={props.calculateLevel}/>

            <div className="main-container">
                <aside>
                    <LeaderBoard changePage={props.changePage} getAllUsers={props.getAllUsers} setUserProfil={props.setUserProfil} tinyVersion={true} calculateLevel={props.calculateLevel}/>
                </aside>

                <article>
                    <div className="main-page"> 
                        <h1>Bienvenue sur <br></br>Quiz of Legends !</h1> 
                        <p>Testez vos connaissances sur League of Legends en répondant à des questions sur le jeu !</p>
                    </div>
                    
                    <div className="box">
                        <div className="rectangle"></div>
                        <div className="rectangle2"></div>
                        <div onClick={() => props.changePage("questionPage")} className="arrow_box">
                            <span>JOUER</span>
                        </div>
                    </div>

                </article>	
            </div>
            
            <footer>
                <div className="parametres" onClick={() => props.changePage("parametres")}>Parametres</div>
            </footer>		
        </div>
        
    );
	
}

export default HomePage;
