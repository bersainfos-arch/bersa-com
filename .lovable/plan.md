# Créer votre compte gestionnaire BERSA

## Ce qui sera fait
1. **Création de votre compte** avec l'adresse dieudonnedjoma@gmail.com, déjà confirmée (pas besoin de cliquer sur un lien de confirmation).
2. **Profil rempli** : prénom « Dieudonné », nom « Djoma », téléphone +243 818 147 637 (modifiables ensuite).
3. **Accès Gestion activé** directement sur ce compte.
4. **Choix de votre mot de passe** : je ne choisis pas votre mot de passe à votre place. Vous recevrez un e-mail « Définir mon mot de passe » ; le lien ouvre une page BERSA où vous saisissez le mot de passe de votre choix.
5. **Lien « Mot de passe oublié ? »** ajouté sur l'écran de connexion, pour vous et pour tous les utilisateurs.
6. **Facture imprimable pour chaque commande** : un bouton « Facture » dans le Profil du client et dans Gestion ouvre une page avec le logo BERSA, un numéro de facture, la date, le nom et le téléphone du client, l'article commandé, le prix, l'état du paiement (en vérification ou payé, avec la référence), et les deux numéros Mobile Money (M-Pesa +243 818 147 637, Airtel Money +243 971 395 319). Un bouton « Imprimer / PDF » lance l'impression ; les menus de l'application sont masqués à l'impression.
7. **Vérification** : je vérifie que le compte existe, qu'il a bien l'accès Gestion, que la page de choix du mot de passe s'affiche, et qu'une facture s'ouvre et s'imprime correctement à partir d'une commande d'essai.

## Ensuite, de votre côté
- Ouvrir l'e-mail reçu sur dieudonnedjoma@gmail.com (pensez à regarder dans les spams).
- Choisir votre mot de passe, puis vous connecter : l'onglet Gestion sera accessible.

## Détails techniques
- Création du compte côté serveur, avec l'e-mail déjà confirmé ; ajout de la ligne du profil et du rôle admin.
- Nouvelle page publique `/reset-password`, hors de l'écran de connexion obligatoire : elle détecte la session de récupération et appelle `updateUser({ password })`.
- Envoi du lien avec `resetPasswordForEmail` (redirection vers `/reset-password`) ; le formulaire « Mot de passe oublié » utilise le même appel.
