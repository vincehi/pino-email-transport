# 🚀 Commandes pour publier sur npm

## 📋 Checklist avant publication

```bash
# 1. Vérifier que les tests passent
npm test

# 2. Vérifier que le build fonctionne
npm run build

# 3. Vérifier l'état Git (tout doit être commité)
git status
```

## 🎯 Commandes de publication

### Option 1 : Version Minor (recommandé - nouvelles fonctionnalités)

Vous avez ajouté `flushInterval` et `flushThreshold`, donc **minor bump** :

```bash
# 1. Bump la version (0.1.6 → 0.2.0)
npm version minor

# 2. Publier (le build se fait automatiquement via prepublishOnly)
npm publish --access public

# 3. Pousser sur Git (commits + tags)
git push origin main
git push --tags
```

### Option 2 : Version Patch (si corrections de bugs uniquement)

```bash
# 1. Bump la version (0.1.6 → 0.1.7)
npm version patch

# 2. Publier
npm publish --access public

# 3. Pousser sur Git
git push origin main && git push --tags
```

### Option 3 : Version Major (breaking changes)

```bash
# 1. Bump la version (0.1.6 → 1.0.0)
npm version major

# 2. Publier
npm publish --access public

# 3. Pousser sur Git
git push origin main && git push --tags
```

## 📝 Workflow complet recommandé

```bash
# 1. Vérifier les tests
npm test

# 2. Build manuel pour vérifier
npm run build

# 3. Bump version minor (nouvelles fonctionnalités flush)
npm version minor

# 4. Publier (build automatique)
npm publish --access public

# 5. Pousser sur Git
git push origin main && git push --tags
```

## 🔍 Commandes utiles

```bash
# Voir la version actuelle
npm version

# Voir qui vous êtes sur npm
npm whoami

# Voir les informations du package publié
npm view pino-email-transport

# Tester la publication sans publier (dry-run)
npm publish --dry-run

# Voir ce qui sera inclus dans le package
npm pack
```

## ⚠️ Notes importantes

- **Le build est automatique** : `prepublishOnly` exécute `npm run build` avant chaque publication
- **Le clean est inclus** : Le script `build` supprime `dist` avant de builder
- **Seul `dist` est publié** : Défini dans `"files": ["dist"]`
- **Les tests ne sont pas publiés** : Le dossier `tests/` n'est pas inclus

## 🎉 Après publication

Vérifiez que la publication a réussi :

```bash
# Voir la version publiée
npm view pino-email-transport version

# Voir toutes les versions
npm view pino-email-transport versions
```

