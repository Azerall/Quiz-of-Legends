import { useState, useEffect } from 'react'
import axios from 'axios';
import './index.css';

const pictures = require.context('./profil_picture', true); // Importe les images de profil


// ProfilPage est la page de profil de l'utilisateur
function ProfilPage (props) {
    const [profil_picture, setProfilPicture] = useState(props.user.Picture);

    const [editingPicture, setEditingPicture] = useState(false); // Indique si l'utilisateur est en train de modifier sa photo de profil

    useEffect(() => {
        setProfilPicture(props.user.Picture); // Affiche la photo de profil de l'utilisateur seulement après avoir récupéré les données
    }, [props.user]);
    
    // Fonction pour modifier la photo de profil en affichant les images disponibles
    const editPicture = () => {
        const chemin = pictures.keys();
        const images = chemin.map(path => {
            const imageName = path.substring(2);
            return (
                <img key={path} src={pictures(path)} alt={`${imageName}`} onClick={() => updateProfilePicture(imageName)}/>
            );
        });
        return (
            <div className="list-image">
                {images}
            </div>
        );
    }

    // Fonction pour mettre à jour la photo de profil
    const updateProfilePicture = (newPicture) => {
        axios.post(`${process.env.REACT_APP_API_URL}/api/user/setPicture`, {
            userID: props.user.ID,
            picture: newPicture
        })
        .then(response => {
            setProfilPicture(newPicture);
            props.setUser({...props.user, Picture: newPicture});
            console.log(response.data.message);
            setEditingPicture(!editingPicture);
        })
        .catch(error => console.error('Erreur lors de la mise à jour de l\'image de profil:', error));
    };

    return (
        <article>
            <div className='profil-container'>
                <div className={`${props.isMe ? 'profil_image' : 'profil_image_no_hover'}`} onClick={() => setEditingPicture(!editingPicture)}>
                    { profil_picture ? <img src={pictures(`./${profil_picture}`)} alt="Photo de profil"/> : "" }
                </div>
                { props.isMe && editingPicture ? editPicture() : ""} { /* Modification possible seulement lorsque le profil consulté est le sien */} 
                <div className="profil-text">
                    <h1>{props.user.Pseudo}</h1>
                    <p>Niveau : {props.calculateLevel(props.user.Experience)}</p>
                    <p>Réponses correctes : {props.user.CorrectAnswers}</p>
                    <p>Nombre de réponses total : {props.user.NbAnswers}</p>
                    <p>Précision : {props.user.NbAnswers > 0 ? ((props.user.CorrectAnswers / props.user.NbAnswers) * 100).toFixed(2) : (0).toFixed(2) /* On évite la division par 0 */}%</p>
                </div>
            </div>   
        </article>
    );
}

export default ProfilPage; 