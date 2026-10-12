# Plan de reconstruction BERSA (par étapes, sans perte de données)

## Points à confirmer avant de commencer
- **Dépôt GitHub** : je ne peux pas importer un dépôt existant comme source. On peut seulement relier ce projet à GitHub depuis Paramètres → GitHub, ce qui crée un nouveau dépôt. Je reconstruis donc ici à partir de l'application actuelle.
- **« Bolt Database »** : on garde la base de données Lovable Cloud déjà en place. Toutes vos données actuelles (comptes, commandes, livres, documents) sont conservées.
- **Choix qui remplacent les anciennes règles** : plus de téléphone à l'inscription ni sur les profils, prix des abonnements visibles tout de suite, accueil sans diaporama, sans photo et sans « BERSA Consulting », numéros Mobile Money retirés des pages publiques. Les anciennes commandes gardent leur numéro de téléphone, mais il n'est plus affiché.
- **Paiement** : rien n'est automatique tant qu'aucun service de paiement (FlexPay, MaxiCash…) n'est branché. Un client déclare son paiement Mobile Money, et l'administrateur active l'abonnement seulement après avoir vérifié l'argent reçu. Aucune activation simulée.

## Étapes (une livraison testée à chaque fois)
1. **Identité et navigation** : bleu nuit, blanc et or, mode sombre ou clair. Écran de démarrage (logo 2 s, puis slogan). Pages /signup et /login. Menu latéral sur ordinateur, barre en bas sur téléphone. Pages /app, /app/documents, /app/profile, /admin.
2. **Authentification** : inscription (nom, prénom, e-mail, mot de passe et sa confirmation), connexion avec bouton pour afficher le mot de passe, mot de passe oublié, déconnexion vers /login, pages protégées et pages réservées aux administrateurs.
3. **Tableau de bord /app et barre IA centrale** : message de bienvenue selon l'heure, recherche globale, bouton de partage. Barre IA avec 9 actions, dictée vocale, lecture audio des réponses, ajout de fichiers (PDF, DOCX, TXT, images, avec taille maximale affichée), historique compact. 18 modèles de rédaction (académique, administratif, juridique, littéraire).
4. **Éditeur Word A4** : feuille de 794 × 1 123 px, Times New Roman 13 pt, interligne 1,6. Mise en forme complète, tableaux, liens, images, notes de bas de page, table des matières, sauts de page. Barre IA séparée avec fenêtre « Ajouter au document / Remplacer la sélection / Copier ». Sauvegarde automatique, export HTML et PDF, impression A4, 4 catégories, documents jusqu'à 30 000 caractères.
5. **Assistant IA conversationnel** : réponse qui s'affiche au fur et à mesure, bouton Arrêter, conversations multiples enregistrées, quotas vérifiés sur le serveur (barre verte, ambre ou rouge, message discret à 10 conversations, fenêtre d'offres quand le quota est épuisé).
6. **Abonnements** : 5 formules avec la grille de prix fournie en USD, page de comparaison, parcours de souscription, prix, durées et quotas modifiables depuis l'administration, suivi des dates de début et d'expiration.
7. **Mes documents et profil** : tags, favoris, résumé par l'IA, partage public désactivé par défaut et révocable, commentaires sur les documents partagés. Profil avec photo, adresse, état civil, domaine, biographie, statistiques et badges.
8. **Formations** : création avec modules et leçons réorganisables, inscription, bouton « Continuer », progression, lien partageable, formateurs classés par domaine.
9. **Bibliothèque** : 12 domaines avec le nombre de livres, fiche de publication complète, résumé généré par l'IA puis validé par l'utilisateur, recherche, filtres, favoris, fichiers privés réservés aux acheteurs.
10. **Opportunités** : publication d'offres, candidature avec pièces jointes, accusé de réception, dossiers confidentiels.
11. **Paramètres** : profil, partage, langues (FR, EN, lingala, espagnol, portugais et 20 autres, choix mémorisé), installation sur téléphone, pages Confidentialité et Règlement.
12. **Administration et sécurité** : statistiques réelles, 10 derniers inscrits, gestion des contenus, des abonnements et des quotas, journal des actions, vérification des accès avec plusieurs comptes.

## Détails techniques
- Pile actuelle conservée : TanStack Start et Lovable Cloud. Fonctions serveur pour l'IA et les opérations d'administration. Lovable AI Gateway avec le modèle openai/gpt-6-astra en streaming.
- Nouvelles tables (UUID, RLS, GRANT) : document_tags, trainings, training_modules, training_lessons, training_enrollments, library_books, opportunities, applications, ai_conversations, ai_messages, ai_usage, subscriptions, subscription_plans (données de départ : grille tarifaire), favorites, document_comments, notifications, user_badges, app_settings, audit_logs.
- Tables existantes enrichies uniquement par ajouts : profiles (avatar, bio, adresse, état civil, domaine ; la colonne phone devient facultative et n'est plus utilisée), user_docs (statut, nombre de caractères, is_public, public_token). Les tables books et orders restent lisibles. Les livres actuels sont copiés dans library_books.
- Rôles conservés dans user_roles. Quotas comptés côté serveur à partir de ai_usage.
- Éditeur : TipTap avec des extensions pour les notes de bas de page, la table des matières et les sauts de page. PDF par impression A4 du navigateur.
- Langues : fichiers de traduction côté interface. Les 25 langues seront traduites automatiquement, puis à relire.
- Ce qui reste à configurer de votre côté : les clés d'un service de paiement pour l'activation automatique, et les notifications push (facultatif).
