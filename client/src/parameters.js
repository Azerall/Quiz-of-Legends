import { useState, useEffect } from 'react'
import './index.css';
import axios from 'axios';


// Parametres est la page de paramètres de l'application
function Parametres(props) {

    const [pseudo, setPseudo] = useState("");
    const [password, setPassword] = useState("");

    const [pass1, setPass1] = useState("");
    const [pass2, setPass2] = useState("");

    const [filled, setFilled] = useState(true); // Vérifie si les champs sont remplis
    const [exist, setExist] = useState(true); // Vérifie si le mot de passe est correct
    const [passOK, setPassOK] = useState(true); // Vérifie si les mots de passe sont identiques
    const [isValidPassword, setIsValidPassword] = useState(true); // Vérifie si le nouveau mot de passe est valide
    const [notSame, setNotSame] = useState(true); // Vérifie si le mot de passe est différent de l'ancien

    const getPseudo = (evt) => {setPseudo(evt.target.value)};
    const getPassword = (evt) => {setPassword(evt.target.value)};
    const getPass1 = (evt) => {setPass1(evt.target.value)};
    const getPass2 = (evt) => {setPass2(evt.target.value)};

    const [changePseudo, setChangePseudo] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const [deleteUser, setDeleteUser] = useState(false);

    // Fonction pour modifier le pseudo
    const submissionHandlerPseudo = (evt) => {
        evt.preventDefault();
        setFilled(true);
        setExist(true);
        if (password.trim() === '') {
            setFilled(false);
        } else if (password != props.user.Password) {
            setExist(false);
        } else {
            axios.put(`${process.env.REACT_APP_API_URL}/api/user/changePseudo/${props.user.ID}`, {
                NewPseudo: pseudo
            })
            .then(response => {
                console.log("Mise à jour du nouveau pseudo : ", pseudo);
                props.setUser({...props.user, Pseudo: pseudo});
                reset();
            })
            .catch((error) => {
                console.log("Erreur lors de la modification du pseudo");
            })

        }
    }

    // Fonction pour modifier le mot de passe
    const submissionHandlerPassword = (evt) => {
        evt.preventDefault();
        setFilled(true);
        setExist(true);
        setPassOK(true);
        setIsValidPassword(true);
        setNotSame(true);
        if (password.trim() === '' || pass1.trim() === '' || pass2.trim() === '') {
            setFilled(false);
        } else if (pass1.length < 6) {
            setIsValidPassword(false);
        } else if (pass1 != pass2){
            setPassOK(false);
        } else if (password != props.user.Password) {
            setExist(false);
        } else if (password === pass1) {
            setNotSame(false);
        } else {
            axios.put(`${process.env.REACT_APP_API_URL}/api/user/changePassword/${props.user.ID}`, {
                NewPassword: pass1
            })
            .then(response => {
                console.log("Nouveau mot de passe enregistré");
                props.setUser({...props.user, Password: password});
                reset();
            })
            .catch((error) => {
                console.log("Erreur lors de la modification du mot de passe");
            }) 
        }
    }

    // Fonction pour supprimer le compte
    const submissionHandlerDelete = (evt) => {
        evt.preventDefault();
        setFilled(true);
        setExist(true);
        if (password.trim() === '') {
            setFilled(false);
        } else if (password != props.user.Password) {
            setExist(false);
        } else {
            axios.delete(`${process.env.REACT_APP_API_URL}/api/user/deleteUser/${props.user.ID}`)
            .then(response => {
                props.logout();
            })
            .catch(error => console.error('Erreur lors de la suppression du compte', error));
        }
    }

    // Fonction pour réinitialiser les états et masquer les formulaires
    const reset = () => {
        setChangePseudo(false);
        setChangePassword(false); 
        setDeleteUser(false);
        setPseudo("");
        setPassword("");
        setPassOK("");
        setPass2("");
        setFilled(true);
        setExist(true);
        setPassOK(true);
        setIsValidPassword(true);
        setNotSame(true);
    }

    return (
        <article>
            <div className = "parametres-container">
                <button onClick={() => { reset(); setChangePseudo(!changePseudo)}}>Modifier le pseudo</button>
                { changePseudo ?
                    <form onSubmit={submissionHandlerPseudo}>
                        <div className="inputBox">
                            <input id="pseudo" type="text" name="Pseudo" placeholder="Nouveau pseudo" onChange={getPseudo}/>
                            <input id="mdp" type="password" name="Password" placeholder="Confirmation du mot de passe" onChange={getPassword}/>
                        </div>
                        <div className="parametres-response">
                            <input type="submit" name="" value="OK"/>
                            <input type="button" onClick={() => reset()} value="Annuler"/>
                        </div>
                        {filled ? null : <p>Veuillez remplir tous les champs</p>}
                        {exist ? null : <p>Mot de passe invalide</p>}
                    </form>
                    :
                    ""
                }

                <button onClick={() => { reset(); setChangePassword(!changePassword)}}>Modifier le mot de passe</button>
                { changePassword ?
                    <form onSubmit={submissionHandlerPassword}>
                        <div className="inputBox">
                            <input id="signin_mdp1" type="password" name="Password" placeholder="Ancien mot de passe" onChange={getPassword}/>
                            <input id="signin_mdp2" type="password" name="Password" placeholder="Nouveau mot de passe" onChange={getPass1}/>
                            <input id="signin_mdp" type="password" name="Password" placeholder="Confirmation du mot de passe" onChange={getPass2}/>
                        </div>
                        <div className="parametres-response">
                            <input type="submit" name="" value="OK"/>
                            <input type="button" onClick={() => reset()} value="Annuler"/>
                        </div>
                        {filled ? null : <p>Veuillez remplir tous les champs</p>}
                        {isValidPassword ? <p></p> : <p>Erreur : Votre nouveau mot de passe doit faire au moins 6 caractères</p>}
                        {passOK ? <p></p> : <p>Mots de passe différents</p>}
                        {exist ? null : <p>Mot de passe invalide</p>}
                        {notSame ? null : <p>Le nouveau mot de passe doit être différent de l'ancien</p>}
                    </form>
                    :
                    ""
                }

                <button onClick={() => { reset(); setDeleteUser(!deleteUser); }}>Supprimer le compte</button>
                { deleteUser ?
                    <form onSubmit={submissionHandlerDelete}>
                        <h3>Etes-vous sûr de vouloir supprimer votre compte ?</h3>
                        <div className="inputBox">
                            <input id="mdp" type="password" name="Password" placeholder="Confirmation du mot de passe" onChange={getPassword}/>
                        </div>
                        <div className="parametres-response">
                            <input type="button" onClick={() => reset()} value="Non"/>
                            <input type="submit" name="" value="Oui"/>
                        </div>
                        {filled ? null : <p>Veuillez remplir tous les champs</p>}
                        {exist ? null : <p>Mot de passe invalide</p>}
                    </form>
                    :
                    ""
                }
            </div>
        </article>
    );
}

export default Parametres;
