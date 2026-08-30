> **STATUS: SUPERSEDED / ARCHIVED**
>
> This document is preserved for historical and contextual reference.
> It is **NOT** the current source of truth.
>
> When this document conflicts with the current documentation,
> **the current documentation takes precedence.**
>
> **Superseded on:** 2026-08-30
> **Superseded by:** the ZeroCorp v1 documentation set —
> [`PRODUCT_VISION.md`](../../PRODUCT_VISION.md),
> [`PRODUCT_SPEC.md`](../../PRODUCT_SPEC.md),
> [`ARCHITECTURE.md`](../../ARCHITECTURE.md),
> [`DATABASE.md`](../../DATABASE.md),
> [`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md),
> [`CLAUDE_CODE_RULES.md`](../../CLAUDE_CODE_RULES.md).
>
> **Do not** use this document to justify a product, architecture, database,
> pricing or engineering decision.
>
> Content below is preserved verbatim (original language: French).
> Decisions that were reversed, and knowledge that still exists only here,
> are tracked in [`docs/OPEN_DECISIONS.md`](../../OPEN_DECISIONS.md).

---

# ZeroCorp — Cartographie produit et architecture

Document de référence technique. Décrit le produit complet, ses composants, l'architecture multi-tenant, et pour chaque brique les projets open source à récupérer plutôt qu'à recoder.

*Version 2 — intègre les arbitrages sur Hermes, Postiz, l'onboarding vocal, les domaines et le KYC.*

---

## 1. Ce que fait le produit

Un client non-résident américain arrive, paye 997 $, et repart avec :

- une société américaine réellement immatriculée (LLC), avec ses documents et son EIN
- un site web à son nom, sur son domaine
- un blog qui publie tout seul
- des comptes sociaux alimentés automatiquement
- une base de prospects dans sa niche
- une infrastructure d'emailing sur son domaine
- des agents qui font tourner l'ensemble
- un back-office où il voit et pilote tout

Il paye ensuite 99 $/mois pour que ça continue de tourner.

**Le produit n'est pas un générateur de sites. C'est un système d'exploitation d'entreprise dont le site n'est qu'une sortie parmi d'autres.**

---

## 2. La décision d'architecture centrale

Tout le projet dépend d'un choix, et c'est le seul endroit où une erreur coûte des semaines.

### Le mauvais chemin

Générer du code par client, le déployer sur Vercel ou un conteneur dédié, un projet par client.

Conséquences : coût par client qui explose, 500 déploiements à maintenir, impossibilité de corriger un bug partout à la fois.

### Le bon chemin

**Un seul moteur de rendu multi-tenant. Les sites sont des données, pas du code.**

Tu codes **une fois** une bibliothèque de blocs. Un client, c'est du JSON qui dit quels blocs, dans quel ordre, avec quel contenu.

```json
{
  "theme": "bold-dark",
  "blocks": [
    { "type": "hero", "title": "...", "subtitle": "...", "cta": "..." },
    { "type": "services", "items": [...] },
    { "type": "testimonials", "items": [...] },
    { "type": "faq", "items": [...] }
  ]
}
```

Le composant React qui rend un `hero`, tu l'écris une seule fois, et tu peux en servir 500 différents.

```
client1.com  ─┐
client2.com  ─┼──▶  Cloudflare for SaaS  ──▶  App Next.js unique  ──▶  Postgres
client3.com  ─┘         (SSL auto)              (résolution par Host)
```

### Blocs, pas templates

Un template figé est rigide, et certains clients auront des besoins qu'il ne couvre pas. La réponse est de raisonner en **bibliothèque de blocs librement combinables**, pas en pages toutes faites.

Bibliothèque cible (~20 blocs) : hero, services, tarifs, témoignages, FAQ, équipe, galerie, statistiques, process, comparatif, logos clients, à propos, contact, carte, CTA, article mis en avant, formulaire de devis, bandeau annonce, avant/après, chiffres clés.

Vingt blocs librement ordonnés couvrent l'immense majorité des besoins d'un cabinet ou d'une agence. Quand un client veut quelque chose d'inédit, tu ajoutes un bloc : il devient disponible pour tout le monde. Ton produit s'enrichit au lieu de se fragmenter.

### Le client doit pouvoir éditer

Sinon ce n'est pas son site. Trois niveaux, aucun ne touche au code :

1. Modifier un texte ou une image
2. Réordonner, dupliquer ou supprimer un bloc
3. Régénérer une section par IA avec une consigne

Avantage collatéral : il ne peut rien casser, et tu corriges un bug de rendu chez tous tes clients d'un coup.

### Domaines et SSL

**Cloudflare for SaaS.** 100 hostnames personnalisés inclus sur les plans Free, Pro et Business, puis **0,10 $/mois par hostname** supplémentaire, jusqu'à 50 000 en pay-as-you-go.

À 500 clients : **40 $/mois**. Le meilleur rapport de tout le stack.

Deux limites à connaître : les webhooks sur le statut des hostnames sont réservés à l'Enterprise, donc polling pendant l'onboarding (30 secondes d'intervalle, indolore à ton échelle). Et si le client a son domaine sur Cloudflare et active le nuage orange, le TLS casse — prévois la détection et le message d'erreur, c'est le bug de support numéro un.

---

## 3. Isolation des données

**Choix retenu : tenancy par ligne, une seule base Postgres, `tenant_id` sur chaque table, Row Level Security activée.**

| Modèle | Provisionner un client | Verdict |
|---|---|---|
| Base par tenant | Créer une base + jouer les migrations | Non |
| Schéma par tenant | `CREATE SCHEMA` + jouer les migrations, et chaque future migration tourne N fois | Non |
| **Ligne + RLS** | **Un `INSERT`** | **Oui** |

Règle absolue : **aucune requête sans filtre tenant.** La RLS Postgres est le filet de sécurité, pas un substitut à la discipline applicative. Une fuite entre clients sur un produit qui stocke des passeports, c'est la fin du projet.

Exception : les documents d'identité vont dans un bucket privé séparé avec son propre contrôle d'accès. Voir §8.

---

## 4. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Front + API | Next.js (App Router) + TypeScript | Un seul repo, rendu multi-tenant natif |
| Base | Supabase (Postgres) | RLS native, auth et stockage dans le même produit |
| ORM | Drizzle | Requêtes proches du SQL, relisibles, compatibles RLS |
| Cache / files | Redis | Sessions, rate limiting |
| Jobs et workflows | Inngest | Génération, publication, agents. Rien à maintenir |
| Auth | Supabase Auth | Gratuit jusqu'à 50 000 utilisateurs actifs |
| Paiement | Stripe (+ Radar) | Abonnement, one-shot, crédits, anti-fraude |
| Stockage | Supabase Storage | Documents privés, images générées |
| Domaines / SSL | Cloudflare for SaaS | 0,10 $/hostname |
| LLM | OpenRouter | Changer de modèle sans toucher au code |
| Images | fal.ai | Agrégateur : FLUX, Seedream, Qwen, Nano Banana |
| Transcription | Whisper via Groq | Onboarding vocal |
| Agents | Hermes Agent (MIT) | Voir §6.10 |
| Email transactionnel | Resend | Tes emails à toi |
| Observabilité | Sentry + Posthog | Erreurs et usage produit |

### Drizzle plutôt que Prisma

| | Prisma | Drizzle |
|---|---|---|
| Schéma | Langage dédié `.prisma` | TypeScript |
| Requêtes | API abstraite | Proche du SQL |
| Poids | Client généré, lourd | Léger, compatible edge |
| RLS Supabase | Contournements | Direct |

La raison décisive : les requêtes Drizzle ressemblent au SQL, donc Claude Code produit du code correct plus souvent et tu peux relire ce qu'il écrit. Avec Prisma tu débogues une abstraction. Les deux marchent — ne perds pas une heure là-dessus.

### Queue plutôt que cron

Le cron va bien pour « tous les jours à 6 h ». Il s'écroule avec 500 tenants qui publient chacun à son heure, avec retries, limites de débit vers les API externes et workflows en plusieurs étapes.

Inngest pour la V1 : géré, retries et observabilité inclus. BullMQ est gratuit mais demande un Redis et un worker à garder vivant — de l'ops que tu n'as pas le temps de faire ce mois-ci.

### Modèles image : routage

| Modèle | Prix/image | Quand |
|---|---|---|
| SDXL Turbo / FLUX Schnell | 0,0002–0,003 $ | Volume quotidien |
| Z-Image Turbo / Qwen-Image | ~0,01 $ | Intermédiaire |
| Seedream 4.0 | 0,03 $ | Visuels soignés, sans visage |
| Nano Banana Pro | 0,15 $ | Dès qu'il y a des personnes |

Seedream est faible sur les visages. Route systématiquement les visuels avec personnes vers Nano Banana : quelques centimes de plus sur 10 % du volume, et tu évites les images ratées qui font résilier. Ne self-héberge pas de GPU — tu paierais plus cher que fal.ai avant 100 clients.

---

## 5. Modèle de données

### Identité et compte

```
tenants          id, name, slug, plan, status, created_at
users            id, email, name, auth_provider
memberships      user_id, tenant_id, role
```

### Le profil de marque — la pièce maîtresse

```
brand_profiles   tenant_id, business_name, description, industry,
                 icp_description, tone_of_voice, target_keywords[],
                 unique_selling_points[], languages[],
                 competitor_urls[], brand_colors, logo_url,
                 source_documents[], voice_transcript
```

C'est la table la plus importante du produit. **Tout ce que génèrent tes agents — articles, posts, créatives, emails — lit ce profil.** Sa qualité détermine la qualité de toute la sortie. C'est le « prompting en amont », et il doit être une entité de premier ordre, pas un champ texte.

L'onboarding a un seul vrai objectif : remplir cette table correctement.

### Société

```
companies           tenant_id, legal_name, entity_type, state,
                    status, ein, formation_date, registered_agent_until
formation_orders    company_id, provider, provider_ref, status,
                    cost_cents, price_cents, submitted_at, completed_at
company_documents   company_id, type, storage_key, issued_at
signatures          tenant_id, document_id, signature_image_key,
                    signed_at, ip, user_agent
```

Machine à états stricte :

```
draft → documents_collected → kyc_passed → submitted → filed
      → formed → ein_pending → ein_issued → complete
```

### Site et contenu

```
sites            tenant_id, domain, subdomain, template, theme_json,
                 status, ssl_status
pages            site_id, slug, type, content_json, published_at
posts            site_id, slug, title, content_md, meta_json,
                 status, scheduled_for, published_at
```

### Social

```
social_accounts  tenant_id, platform, external_id, access_token_enc,
                 refresh_token_enc, expires_at, status
content_items    tenant_id, type, payload_json, asset_urls[],
                 status, scheduled_for, published_at, platform_targets[]
publish_attempts content_item_id, platform, status, external_id, error
```

### Prospection

```
lead_lists       tenant_id, name, source, filters_json, count
leads            list_id, company_name, domain, email, country,
                 industry, enriched_json, consent_basis
email_domains    tenant_id, domain, dns_status, warmup_status,
                 daily_limit, reputation_score
```

### Crédits et facturation

```
subscriptions    tenant_id, stripe_id, plan, status, current_period_end
credit_ledger    tenant_id, delta, reason, ref_type, ref_id, created_at
usage_events     tenant_id, feature, model, units, cost_cents, created_at
```

`credit_ledger` est en append-only. Le solde est la somme des deltas, jamais un champ mis à jour. Seule façon d'auditer un litige de facturation.

`usage_events` enregistre le **coût réel** en plus des crédits débités. C'est ce qui te dira, dans trois mois, si ton enveloppe à 99 $ est bien calibrée.

### Agents

```
agent_runs       tenant_id, agent_type, trigger, input_json,
                 output_json, status, cost_cents, duration_ms, error
```

Tout passage d'agent est tracé. Sans ça, tu ne peux ni facturer, ni déboguer, ni identifier le client qui fait exploser tes coûts.

---

## 6. Les modules, un par un

### 6.1 Acquisition et paiement

**Rôle** — Landing, page de vente, checkout 997 $, création du tenant.

**Fonctionnement** — Stripe Checkout en paiement unique + abonnement créé au jour 1. Webhook Stripe → création du tenant → email de bienvenue → onboarding.

**Anti-fraude** — Stripe Radar activé dès le départ. Il note chaque paiement selon des centaines de signaux (appareil, IP, historique de la carte sur tout le réseau Stripe, cohérence des pays) et bloque au-dessus d'un seuil. Écris deux ou trois règles simples : mise en revue si pays de carte ≠ pays IP, blocage après 3 tentatives échouées. Inclus dans les frais standards.

**À prévoir** — Le compte Stripe passera probablement en revue manuelle. Ticket élevé, clientèle internationale, secteur surveillé. À ouvrir en semaine 1.

**Effort** — 2 jours.

---

### 6.2 Onboarding — vocal d'abord

**Rôle** — Collecter tout ce qu'il faut pour la société et pour le profil de marque.

**Le vocal est le mode par défaut, pas une option.** Les gens expliquent bien mieux leur activité à l'oral qu'en remplissant un formulaire. Trois minutes de voix donnent un profil de marque plus riche que vingt champs texte, et ça supprime le principal point d'abandon.

**Flux** :

1. Le client répond oralement à 5–6 questions ouvertes (activité, cible, ce qui te différencie, concurrents, ton, objectifs)
2. Transcription via Whisper sur Groq — quelques centimes de l'heure d'audio, réponse en secondes
3. Un agent structure la transcription et pré-remplit `brand_profiles`
4. Le client relit et corrige un formulaire déjà rempli

**Enrichissement automatique** — Si le client donne l'URL de son site actuel ou de son LinkedIn, un agent l'analyse et complète le profil avant même les questions.

**Volet légal** — identité, adresse, passeport, nom de société souhaité, État, type d'entité. Sauvegarde à chaque étape : l'abandon en cours de route est la norme.

**Formulaire classique en secours** pour ceux qui refusent le micro.

**Effort** — 3 jours.

---

### 6.3 Immatriculation

**Rôle** — Transformer une commande en société réelle.

**Fonctionnement V1 — manuel assisté** :

1. Le dossier passe en `documents_collected`
2. Il apparaît dans la console admin
3. L'opérateur saisit la commande chez le prestataire
4. Il colle la référence, statut `submitted`
5. Les documents reçus sont uploadés, le statut avance
6. Le client voit chaque étape dans son back-office

**Fonctionnement V2 — API** : même flux, transitions par webhook. La machine à états ne change pas. **Construis-la dès la V1 comme si l'API existait** — tu remplaceras la saisie manuelle par un appel, sans rien réécrire.

**Signature** — En pratique, l'immatriculation demande surtout des cases à cocher et une image de signature à fournir, pas une signature électronique qualifiée. Le montage retenu :

1. Pendant l'onboarding, le client trace sa signature au doigt ou à la souris → stockée dans `signatures`
2. Tu apposes cette signature sur les documents requis
3. Tu conserves la trace (horodatage, IP, user-agent) comme preuve de consentement

Ça garde le parcours entièrement à ta marque, sans dépendre du flux email du prestataire. À vérifier au cas par cas selon les documents réellement demandés.

**Effort** — 2 jours (console admin + machine à états + capture de signature).

---

### 6.4 Générateur de site

**Rôle** — Produire et servir le site de chaque client.

**Fonctionnement** :

1. Le profil de marque alimente un prompt de génération
2. Le LLM retourne du **contenu structuré en JSON**, jamais du HTML
3. Le JSON est validé contre un schéma (Zod), stocké dans `pages.content_json`
4. Le moteur de rendu applique le thème

**Open source** :

| Projet | Licence | Usage |
|---|---|---|
| shadcn/ui | MIT | Composants, copiés dans ton repo |
| Tiptap | MIT | Édition de texte riche dans les blocs |
| Zod | MIT | Validation des sorties LLM |

**Payload CMS : écarté de la V1.** C'est un bon CMS headless MIT, mais son interface d'admin est faite pour toi, pas pour tes clients — or il te faut un éditeur de blocs orienté client que tu construiras de toute façon. Ajouter un framework de plus pendant ton mois coûte plus que ça ne rapporte. Tables Drizzle + ton éditeur.

**Ne récupère aucun générateur de sites IA existant.** Aucun n'est multi-tenant comme tu en as besoin, et l'adapter coûte plus que de construire.

**Effort** — 5 jours.

---

### 6.5 Moteur de blog

**Rôle** — Publier du contenu qui amène du trafic, sans intervention.

**Fonctionnement** :

1. Passe de stratégie mensuelle → plan éditorial depuis le profil de marque et les mots-clés
2. Job planifié → génération de N articles par jour selon le plan
3. Passe de vérification : longueur, structure, mots-clés, absence de contenu générique
4. Publication automatique, sitemap régénéré, ping des moteurs

**Deux modes au choix du client** : publication automatique, ou file de relecture où il valide, édite et ajoute des images avant publication. Le mode relecture doit exister — certains clients ne laisseront jamais publier sans regarder.

**Point de qualité** — Le contenu doit s'appuyer sur ce que seul le client possède : ses tarifs, sa zone, ses cas clients. Sinon tu produis de l'interchangeable qui ne classera jamais. C'est le profil de marque qui fournit cette matière.

**Effort** — 4 jours.

---

### 6.6 Réseaux sociaux — publishers propriétaires

**Décision : tu écris tes propres publishers.** Postiz est en AGPL, et sa clause d'usage réseau impose de publier ton code si tu diffuses une version modifiée. Copier son backend dans ton application ferait de ton produit une œuvre dérivée sous AGPL. Inacceptable.

Le montage « Postiz non modifié en service séparé, piloté par API » est légalement propre, mais il ajoute un service à maintenir pour un gain limité.

**Coût réel de faire soi-même** : 1 à 2 jours par plateforme. Pour LinkedIn, Facebook/Instagram, X et TikTok, compte une semaine. En échange : zéro contrainte de licence, zéro service supplémentaire, contrôle total du comportement et des erreurs.

**Fonctionnement** :

1. Le client crée ses comptes lui-même — parcours guidé, car la création automatisée est interdite par les plateformes et fait bannir les comptes
2. Connexion OAuth, tokens chiffrés dans `social_accounts`
3. Génération quotidienne : texte depuis le profil de marque, visuel via fal.ai
4. File de publication, une tentative par plateforme, traces dans `publish_attempts`
5. Rafraîchissement automatique des tokens (ils expirent, c'est la première cause de panne silencieuse)

**Blocage calendaire majeur** — La validation des apps OAuth Meta et TikTok prend 2 à 6 semaines et ne dépend pas de toi. **Dépose les demandes le premier jour.** Sans validation, aucune publication sur les comptes de tes clients, quel que soit ton code.

**Effort** — 5 jours, plus l'attente des validations.

---

### 6.7 Créatives

**Rôle** — Produire les visuels pour les posts et la publicité.

**Fonctionnement** — Bibliothèque de gabarits, le LLM choisit le gabarit et écrit le texte, le modèle image génère le fond, composition côté serveur.

**Open source** — Satori (MIT) ou Sharp (Apache-2.0) pour composer texte et image.

**Effort** — 3 jours.

---

### 6.8 Base de prospects

**Rôle** — Livrer au client une liste exploitable dans sa niche.

**Fonctionnement** — Base constituée en amont, pas à la commande. Le client filtre par pays, secteur et taille, exporte ou pousse vers sa séquence.

**Conformité** — Deux règles qui suppriment l'essentiel du risque :

1. **Emails génériques uniquement** (`contact@`, `info@`) dans la base livrée — ce ne sont pas des données personnelles
2. **L'envoi part du domaine du client**, jamais du tien — tu es sous-traitant, pas responsable de traitement

Si tu ajoutes des emails nominatifs plus tard : base légale d'intérêt légitime, mention d'information dans le premier message, lien de désinscription, suppression après 3 ans sans interaction, registre des traitements.

Marché international : les règles varient (CAN-SPAM aux US est plus permissif que le RGPD, la CASL canadienne plus stricte). Le montage ci-dessus tient partout parce qu'il est calé sur le plus strict.

**Open source** :

| Projet | Licence | Usage |
|---|---|---|
| Crawlee | Apache-2.0 | Scraping à grande échelle, Node |
| Firecrawl | AGPL-3.0 | Extraction de pages en markdown (service séparé) |

**Effort** — 3 jours pour l'interface de sélection. La constitution de la base tourne en parallèle du développement.

---

### 6.9 Infrastructure email et domaines

**Domaines — le client achète où il veut, puis délègue les nameservers à ton compte Cloudflare.** Zéro intégration, et tu as le contrôle DNS complet.

Ne revends pas de domaines pour la marge : le gros est à ~9–10 $ le `.com`, tu revendrais 19–25 $, et tu prends la charge du support renouvellement. **Le DNS est ce qui compte**, parce que c'est lui qui décide de la délivrabilité.

Piste de revenu accessoire sans travail : affiliation registrar (Hostinger ou équivalent). Tu recommandes, tu touches une commission, tu ne portes ni l'intégration ni le support. Si tu veux vraiment revendre plus tard : OpenSRS/Tucows ou l'API revendeur Namecheap. Pas Cloudflare Registrar, qui vend au prix coûtant et interdit la revente.

**Email — fonctionnement** :

1. DNS délégué → configuration automatique SPF, DKIM, DMARC
2. Provisioning des boîtes
3. Warm-up progressif sur 2 à 3 semaines
4. Envoi plafonné, montée progressive

**Contrainte calendaire** — Le warm-up prend 2 à 3 semaines quel que soit ton code. Un client ne peut pas envoyer en masse le jour 1. Intègre-le dans ta promesse plutôt que de le subir en support.

**Open source** :

| Projet | Licence | Usage |
|---|---|---|
| Postal | MIT | Serveur d'envoi complet, API |
| Listmonk | AGPL-3.0 | Campagnes et listes |
| Mautic | GPL-3.0 | Automation complète, mais lourd — à éviter en V1 |

Postal pour l'envoi et ta propre logique de séquence.

**Effort** — 4 jours.

---

### 6.10 Agents

**Runtime retenu : Hermes Agent (Nous Research, licence MIT).**

Framework d'agent autonome auto-hébergé, lancé en février 2026, adoption très rapide. Ce qui le rend pertinent ici :

- **Licence MIT** — tu peux modifier, embarquer et revendre sans publier ton code. Décisif face aux alternatives AGPL.
- **Système de profils** — chaque profil est un agent indépendant avec sa config, son identité (`SOUL.md`), sa mémoire persistante (SQLite + recherche plein texte), son gateway et ses crons.
- **Mémoire holographique** — stockage de faits qui s'accumule ; l'agent s'améliore sur les tâches répétées.
- **GEPA** — évolution des prompts. Un agent avec 20+ compétences traite des tâches similaires ~40 % plus vite.
- **Agnostique du modèle** — OpenRouter, Anthropic, Ollama local. Tourne sur un VPS à 5 $.

**Le problème à résoudre : il n'est pas multi-tenant.** Les profils sont des fichiers sur disque, la mémoire est un SQLite local. Conçu pour l'agent persistant d'une personne, pas pour 500 clients isolés.

| Option | Verdict |
|---|---|
| Un conteneur par tenant | **Retenu.** Isolation propre. Coût et ops réels à 500 clients. |
| Profils comme tenants, instances mutualisées | Moins cher, mais l'isolation est à valider sérieusement avec des données clients |
| S'en inspirer, coder son runtime | Le plus de contrôle, le plus de temps |

Démarre avec un conteneur par tenant, isolé réseau et système de fichiers, **uniquement pour les clients qui prennent l'option agents.** Pas pour tous.

**Réserves honnêtes** — Une CVE publiée (CVE-2026-7113), une posture par défaut permissive, et un papier arXiv documentant des pertes silencieuses de messages en orchestration multi-agents. C'est un projet de six mois : puissant, pas encore mûr. Durcis la configuration avant de le mettre en production avec des données clients.

**Catalogue d'agents initial** :

| Agent | Ce qu'il fait |
|---|---|
| Stratège de contenu | Plan éditorial mensuel |
| Rédacteur | Articles de blog |
| Community manager | Posts sociaux quotidiens |
| Assistant mail | Tri, résumé, brouillons de réponse |
| Prospecteur | Séquences sortantes, relances |
| Analyste | Rapport quotidien de ce qui s'est passé |
| Assistant financier | Lecture des retours, suivi des encaissements |
| Assistant juridique | Rappels d'échéances, questions courantes |

L'assistant juridique doit porter une mention claire : avis informatif, pas conseil juridique.

**Abstraction obligatoire** — Tes agents passent par ta table `agent_runs` et ta propre couche d'outils. Le harness derrière reste interchangeable. Ne couple jamais ton produit à un framework d'agents, quel qu'il soit.

**Contrôle par Telegram** — Un bot unique, chaque tenant lie son compte. Récapitulatif quotidien, commandes simples, validations. Canal le plus léger à construire, et tes clients y sont déjà.

**Le poste de coût à surveiller** — Un agent en boucle de raisonnement coûte 20 à 50 fois plus qu'une génération d'article en un coup. C'est le seul endroit où ta marge peut déraper. Plafond dur d'exécutions par tenant et par jour, coupure automatique au dépassement.

**Effort** — 5 jours pour le socle, puis 1 jour par agent.

---

### 6.11 Back-office client

**Rôle** — L'endroit où le client voit son entreprise. **C'est ton produit de rétention.**

Site et blog sont réplicables ailleurs. Un espace où vivent ses documents, ses prospects, son pipeline et son historique ne l'est pas. C'est la raison pour laquelle il ne résilie pas.

**Sections** :

- Tableau de bord — ce que les agents ont fait, ce qui arrive
- Société — statut, documents, échéances de conformité
- Site — pages, éditeur de blocs, statistiques
- Contenu — articles et posts, calendrier, file de relecture
- Prospects — listes, campagnes, réponses
- Pipeline — opportunités, CRM minimal
- Agents — activité, configuration, plafonds
- Facturation — crédits, consommation, factures

**Open source** :

| Projet | Licence | Usage |
|---|---|---|
| Twenty | AGPL-3.0 | CRM moderne. **À lire pour le modèle de données, pas à intégrer** — l'AGPL et le poids ne valent pas le coup pour un pipeline simple. |
| Tremor / shadcn | MIT | Composants de tableau de bord |

**Effort** — 5 jours pour la V1.

---

### 6.12 Console admin

**Rôle** — Ton poste de pilotage et celui de ton opérateur.

**Fonctions** — File des dossiers d'immatriculation, saisie et suivi, upload des documents, consommation par tenant, alertes de dépassement, impersonation pour le support, revue des paiements signalés par Radar.

Sous-estimé et pourtant décisif : sans ça, chaque dossier passe par toi, et tu ne peux rien déléguer.

**Effort** — 2 jours.

---

## 7. Le parcours complet

```
Achat 997 $  ──▶  Stripe Radar  ──▶  Création du tenant
   │
Onboarding
   ├─ Vocal        → transcription → profil de marque pré-rempli → validation
   ├─ Volet légal  → documents, identité, signature capturée, choix d'État
   │
   ├──────────────────────────────┬──────────────────────────────┐
   │                              │                              │
Immatriculation              Génération                    Infrastructure
   │                              │                              │
   ├─ Console admin          ├─ Site publié (J+1)          ├─ DNS délégué
   ├─ Commande prestataire   ├─ Plan éditorial             ├─ SPF/DKIM/DMARC
   ├─ Filing (J+2 à J+7)     ├─ Blog démarré               ├─ Boîtes créées
   ├─ EIN (J+15 à J+45)      ├─ Guide comptes sociaux      ├─ Warm-up (J+21)
   │                              │                              │
   └──────────────────────────────┴──────────────────────────────┘
                                  │
                        Back-office actif
                                  │
                        Abonnement 99 $/mois
                                  │
                        Agents en régime
```

**Points de friction à traiter en priorité** :

- L'EIN prend des semaines pour un non-résident. Dis-le à l'avance, affiche le statut.
- Le warm-up email retarde la prospection de 3 semaines. Même traitement.
- La création des comptes sociaux dépend du client. **C'est le point d'abandon le plus probable de tout le parcours** — soigne ce guide plus que le reste.

---

## 8. Sécurité, fraude et conformité

### Documents d'identité

Tu stockes des passeports. Traité à la légère, c'est le risque qui tue le projet.

1. Bucket privé séparé, chiffré au repos
2. Aucun accès direct — URLs signées, expiration en minutes
3. Journal d'accès complet : qui, quand, quel document
4. L'opérateur voit ce qu'il lui faut pour saisir, rien de plus
5. Suppression automatique après immatriculation confirmée + délai légal
6. 2FA obligatoire sur les comptes admin
7. Rien dans les logs applicatifs, jamais

### Fraude — le vrai risque

**Tu n'as aucune obligation légale de KYC.** Tu n'es pas un établissement financier, et le prestataire d'immatriculation porte ce que la loi exige de son côté.

**Ton risque réel est Stripe.** Tickets à 997 $, clientèle internationale, secteur surveillé. Si ton taux de contestation dépasse leur seuil, ils peuvent fermer ton compte — et sans processeur de paiement, le business s'arrête du jour au lendemain. C'est le risque existentiel, et il est commercial, pas réglementaire.

**Dispositif retenu** :

| Mesure | Coût | Quand |
|---|---|---|
| Stripe Radar | Inclus | Toujours actif |
| Règles Radar personnalisées | Inclus | Pays carte ≠ pays IP → revue |
| Stripe Identity | ~1,50 $ | Uniquement sur commandes signalées |
| Revue manuelle | Temps opérateur | Divergences pays / carte / déclaré |

Pas de prestataire KYC séparé en V1. Radar plus Identity couvrent le besoin, et le fait de pouvoir montrer ce dispositif à Stripe est ce qui te protège si ton compte passe en revue.

### À revérifier avant le lancement

Les obligations de déclaration de bénéficiaire effectif (FinCEN BOI) ont été fortement restreintes en 2025 et ne visent plus les sociétés formées aux États-Unis. Le prestataire porte ce sujet, mais c'est le genre de règle qui rebouge. À revalider.

---

## 9. Licences open source

L'AGPL est présente dans plusieurs briques utiles. Sa clause d'usage réseau impose de publier tes modifications si tu diffuses une version modifiée à des utilisateurs distants.

**Règle de conduite** :

- Tout ce qui est **MIT ou Apache-2.0** (Hermes, Postal, Crawlee, shadcn, Tiptap, Satori, Sharp) : tu peux copier, modifier, embarquer librement
- Tout ce qui est **AGPL** (Firecrawl, Listmonk, Twenty) : soit tu le déploies **non modifié** comme service séparé piloté par API, soit tu ne l'utilises pas

C'est le schéma standard de l'industrie et il est défendable. Mais c'est une question juridique réelle : fais-la valider avant de scaler.

**Vérifie les licences au moment de l'intégration.** Elles changent — plusieurs projets ont migré vers des modèles restrictifs ces deux dernières années. Cas connu : n8n, sous Sustainable Use License, restreint l'usage en service pour des tiers. Ne le mets pas au cœur d'un produit revendu.

---

## 10. Périmètre V1

| Module | V1 | Ensuite |
|---|---|---|
| Landing + checkout + Radar | Oui | |
| Onboarding vocal | Oui | |
| Console admin | Oui | |
| Back-office client | Oui | |
| Générateur de site (blocs + éditeur) | Oui | |
| Moteur de blog | Oui | |
| Crédits + abonnement | Oui | |
| Immatriculation | Manuel | API au mois 4 |
| Base de prospects | Export CSV | Intégrée mois 2 |
| Réseaux sociaux | Connexion manuelle | Publishers propres mois 2–3 |
| Créatives | À la demande | Automatisées mois 2 |
| Agents Hermes + Telegram | Non | Mois 3 |
| Pipeline CRM | Non | Mois 3–4 |

Sept modules à coder. Vends le package complet avec un calendrier de déploiement explicite, en positionnement *founding member* : prix bloqué à vie contre le fait d'être parmi les premiers et de recevoir les fonctionnalités au fil de l'eau.

---

## 11. Stacks à ajouter plus tard

Identifiées, volontairement hors V1.

| Stack | Rôle | Piste |
|---|---|---|
| Signature électronique | Contrats clients, documents formels | Documenso (AGPL, service séparé) ou API Dropbox Sign |
| Facturation client | Le client facture **ses** clients depuis son back-office | Invoice Ninja, Crater, ou développement propre |
| Comptabilité | Suivi des dépenses, préparation fiscale | Partenariat plutôt que développement |
| Déclarations | Annual report, franchise tax | Via le prestataire d'immatriculation |

La facturation est celle qui a le plus de valeur de rétention : un client dont les factures vivent chez toi ne part pas. À prioriser dès que la V1 tourne.

---

## 12. À lancer le premier jour

Ces cinq horloges tournent en parallèle du développement et ne dépendent pas de toi. Elles décident si tu tiens ton mois.

| Action | Délai |
|---|---|
| Demandes de validation OAuth Meta et TikTok | 2 à 6 semaines |
| Vérification du compte Stripe | jours à semaines |
| Achat des domaines d'envoi et démarrage du warm-up | 2 à 3 semaines |
| Constitution de la base de prospects | en continu |
| Compte revendeur chez le prestataire d'immatriculation | 1 à 2 semaines |

---

## 13. Les six erreurs qui coûtent une semaine chacune

1. **Générer du code par client.** Sites = données. Un seul moteur de rendu.
2. **Raisonner en templates figés plutôt qu'en blocs.** Le premier client hors gabarit te bloque.
3. **Traiter le profil de marque comme un champ texte.** C'est la table centrale du produit.
4. **Copier du code AGPL dans ton application.** Ton produit devient publiable sous AGPL.
5. **Lancer les agents sans plafond de consommation.** Dix clients abusifs mangent la marge de cent.
6. **Attendre la fin du développement pour déposer les demandes OAuth.** Elles ne dépendent pas de toi.
