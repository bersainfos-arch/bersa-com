# Adapter BERSA : Assistant, inscription et bibliothèque

## 1. Marque et navigation
- Afficher **Berceau du Savoir** sous les mentions principales de BERSA, avec une présentation discrète et élégante, sans modifier le logo officiel.
- Commencer le menu par **Assistant**, supprimer l’entrée Accueil et l’ancien Assistant séparé, conserver Tableau de bord puis placer Rédaction immédiatement après.
- Garder la même expérience d’écriture sur `/` et `/app`. L’ancien lien `/assistant` ouvrira cette même expérience, sans second assistant.
- Dans Rédaction, remplacer les boutons Commander par **Rédiger** : un clic ouvre l’Assistant avec le type de document choisi, sans créer de commande payante.

## 2. Assistant directement sur le papier
- Organiser les rubriques dans cet ordre : **Assistant · Insérer · Mise en forme**.
- Ajouter un sélecteur d’action avant Envoyer : Générer, Reformuler, Plan, Développer, Résumer, Corriger, Humaniser, Améliorer, Sources, Traduire, Suggestions, Continuer, CV et aide académique. Corriger figurera une seule fois.
- Générer le résultat directement sur le papier blanc modifiable, et non dans une réponse séparée.
- Appliquer les transformations au texte sélectionné lorsqu’il existe, sinon à tout le texte du papier, y compris après retouches manuelles. Séparer la consigne de génération du texte déjà rédigé.
- Humaniser améliore le naturel et la fluidité du style, sans promettre de contourner des détecteurs. Sources présente des références à vérifier, sans les déclarer automatiquement certifiées.
- Placer l’enregistrement audio et Envoyer immédiatement sous le papier. Permettre d’enregistrer, arrêter, écouter, supprimer et transcrire une consigne avant envoi ; prévoir un message clair si le microphone est refusé.
- Afficher en petit sous le papier le quota utilisé/restant et le renouvellement, avec un lien direct **S’abonner**. Conserver les alertes de quota.
- Adapter la hauteur visible du papier et les rubriques pour que les commandes restent accessibles dès le premier écran, notamment sur téléphone ; le texte long défile dans la zone d’écriture.

## 3. Insérer et mise en forme
### Insérer
- Ajouter des fichiers depuis le téléphone ou l’ordinateur, afficher leur nom et permettre leur retrait.
- Extraire le contenu des formats pris en charge pour que l’IA puisse l’utiliser à la demande : texte, PDF et documents Word en priorité ; traiter les images et l’audio par les capacités adaptées.
- Accepter les autres fichiers comme pièces jointes, sans prétendre analyser des exécutables, archives ou formats illisibles. Afficher les limites de taille et les formats analysables, sans envoyer silencieusement un fichier incomplet.
- Ajouter les outils de tableau, lien sécurisé, image et saut de page.

### Mise en forme
Créer cinq sous-rubriques avec des outils réellement utilisables :
- **Accueil** : annuler/rétablir, police, taille, gras, italique, souligné, couleur et surlignage, listes, alignement, interligne, styles de titres et effacement de mise en forme.
- **Mise en page** : marges, orientation, format du papier et sauts de page.
- **Références** : notes de bas de page, bibliographie et table des matières calculée à partir des titres.
- **Révision** : correction IA, recherche/remplacement, comptage des mots et commentaires associés au document.
- **Affichage** : zoom, règle, mode lecture et aperçu avant impression.
- Conserver la sauvegarde et la réouverture des documents ainsi que l’impression/export déjà disponibles.

Ces outils reprennent les usages demandés de Word ; il ne s’agit pas d’intégrer Microsoft Word complet. Aucun outil décoratif ou bouton sans effet ne sera présenté comme fonctionnel.

## 4. Inscription par e-mail ou téléphone
- Remplacer le champ E-mail par **E-mail ou numéro de téléphone**, avec validation de l’adresse ou du numéro international.
- Conserver nom, prénom, mot de passe, confirmation et connexion Google.
- Utiliser la vérification par e-mail ou par code SMS selon le choix ; ajouter l’écran de saisie du code et les messages d’erreur adaptés.
- Les numéros restent privés. Aucun faux e-mail ne sera créé à partir d’un numéro.
- Vérifier si l’envoi SMS est configuré. S’il manque, cette partie attendra sa configuration : l’inscription par e-mail continuera de fonctionner et le téléphone ne sera pas annoncé comme opérationnel.
- Conserver les deux phrases d’ouverture, deux secondes chacune, puis l’inscription.

## 5. Publication de livres par les utilisateurs
- Ajouter **Publier un livre** dans la Bibliothèque, avec : auteur complet, titre, sous-titre facultatif, domaine, lieu et maison d’édition, date de publication, nombre de pages, résumé limité à **5 000 caractères**, prix, devise, fichier ou lien, couverture facultative.
- Prévoir l’ajout du livre et de sa couverture depuis le téléphone, ainsi qu’un aperçu avant publication.
- Si le résumé est vide et le contenu accessible, proposer **Générer le résumé**. Afficher le résultat modifiable et exiger sa validation explicite avant publication.
- Si un lien ou fichier n’est pas lisible, le signaler et demander un résumé rédigé par l’auteur plutôt que d’en inventer un.
- Ajouter **Mes publications** pour consulter les livres proposés et leurs états. Les propositions passent en attente de vérification, avec publication ou refus dans Gestion.
- Ne demander ni coordonnées bancaires ni numéros de réception de paiement dans le formulaire. Ne pas exposer publiquement les fichiers payants, liens privés ou coordonnées financières.

## 6. Achat et téléchargement après paiement
- Réutiliser le paiement Mobile Money existant : demande, référence de transaction, puis vérification par l’administrateur. Une référence seule ne débloque jamais un téléchargement.
- Relier chaque nouvel achat au livre par son identifiant, plutôt que par son titre.
- Afficher **Télécharger** après confirmation du paiement, avec accès contrôlé au fichier privé ; permettre aussi l’accès aux livres gratuits publiés et aux propres fichiers de l’auteur.
- Les ventes opérationnelles utilisent actuellement le parcours USD existant. Les autres devises peuvent être enregistrées mais ne seront pas proposées au paiement tant qu’un parcours correspondant n’est pas disponible.
- Pour les livres payants fournis uniquement par lien, conserver le lien privé et ne proposer la vente que si le téléchargement peut être livré de façon contrôlée. Un lien public ne constitue pas une protection après paiement.
- Ne pas inventer de redistribution automatique de revenus aux auteurs : ce paiement et la confirmation restent ceux de BERSA. Un système de reversement aux auteurs nécessiterait une demande et une configuration distinctes.

## Détails techniques
- Conserver TanStack Start et Lovable Cloud ; partager un seul éditeur entre les points d’entrée.
- Utiliser un moteur d’édition riche éprouvé et des modules séparés pour les actions, l’analyse des fichiers et les outils de mise en forme.
- Valider les entrées côté écran et côté serveur, les liens autorisés et les tailles de fichier. Ne pas injecter de HTML issu des réponses IA.
- Étendre les données de livres et ajouter les liens achat/livre par migration, sans supprimer les livres et commandes existants.
- Appliquer les droits propriétaire/administrateur, les autorisations explicites et les protections des fichiers privés. Les anciens achats sans identifiant de livre nécessitent un rapprochement vérifié, sans déblocage automatique par correspondance de titre.
- Tester les règles concrètes : résumé de 5 000 caractères maximum, publication en attente, validation d’un résumé généré, accès interdit avant paiement et autorisé après paiement vérifié, actions sur le texte retouché.

## Vérifications avant livraison
- Essayer connecté la génération, la retouche puis une transformation du texte, l’ajout d’un document et la transcription audio lorsque le microphone est disponible.
- Vérifier sur grand et petit écran que le papier, le sélecteur, l’audio, Envoyer et le quota sont lisibles sans débordement.
- Vérifier la publication d’un livre, sa lecture depuis Mes publications, son contrôle dans Gestion et l’accès au téléchargement avant/après paiement.
- Signaler précisément tout blocage restant : configuration SMS, format non analysable, service IA indisponible ou devise sans paiement opérationnel.