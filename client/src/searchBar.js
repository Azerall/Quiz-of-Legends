import { useState, useRef, useEffect } from 'react';
import './index.css';


// SearchBar correspond à la barre de recherche
function SearchBar (props) {

    const [searchText, setSearchText] = useState("");
    const [searching, setSearching] = useState(false); // Indique si l'utilisateur est en train de rechercher
    const [searchResults, setSearchResults] = useState([]); // Résultats de la recherche
    const searchRef = useRef(null); // Référence pour la barre de recherche pour gérer les clics en dehors de celle-ci

    const getSearchText = (evt) => {
        setSearchText(evt.target.value);
    };

    // Fonction pour écouter les clics en dehors de la barre de recherche
    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Fonction pour réinitialiser la barre de recherche si on clique en dehors de celle-ci
    const handleClickOutside = (e) => {
        if (searchRef.current && !searchRef.current.contains(e.target)) {
            reset();
        }
    };

    useEffect(() => {
        searchHandler();
    }, [searchText]);

    // Fonction pour rechercher un utilisateur
    const searchHandler = (e) => {
        if (e) e.preventDefault();

        if (!searchText.trim()) { // Si la recherche est vide on ne fait rien
            setSearchResults([]); 
            return;
        }

        setSearching(true); 
        props.getAllUsers((users) => {
            // On filtre les utilisateurs dont le pseudo ou le nom d'utilisateur contient le texte de recherche en minuscule
            const filteredUsers = users.filter(user => 
                user.Username.toLowerCase().includes(searchText.toLowerCase()) || user.Pseudo.toLowerCase().includes(searchText.toLowerCase()));
            setSearchResults(filteredUsers);
        });
    };

    // Fonction pour réinitialiser la barre de recherche
    const reset = () => {  
        setSearching(false);
        setSearchText("");
        setSearchResults([]);
    };

    return (
        <div ref={searchRef}>
            <div className="search-bar">
                <form onSubmit={searchHandler} role="search">
                    <input id="search" type="search" placeholder="Search..." autoFocus required onChange={getSearchText}/>
                    <button type="submit">Ok</button>
                </form>
            </div>

            { !searching ?   
                "" : 
                searchResults.length === 0 ?   
                    <div className="search-result">
                        <p>Aucun résultat trouvé</p>
                    </div>
                    :
                    <div className="search-result">
                        {searchResults.map((user) => (
                            <div key={user.ID} className="profil" onClick={() => { props.setUserProfil(user); props.changePage("profilPage"); reset(); }} >
                                <p>{user.Pseudo} (Niv. {props.calculateLevel(user.Experience)})</p>
                            </div>
                        ))}
                    </div>
            }
        
        </div>
    );  
}

export default SearchBar;
