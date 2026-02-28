export const translations = {
  en: {
    // Nav
    cashFlow: 'Cash Flow',
    transactions: 'Transactions',
    scenarios: 'Scenarios',
    goals: 'Goals',
    advisor: 'Advisor',
    signOut: 'Sign out',
    members: 'Members',

    // View toggle
    yearly: 'Yearly',
    monthly: 'Monthly',

    // Budget summary cards
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    balance: 'Balance',
    annualProjection: 'Annual projection',
    monthlyAverage: 'Monthly average',
    surplus: 'Surplus',
    deficit: 'Deficit',

    // Budget item list
    income: 'Income',
    expenses: 'Expenses',
    perMonth: 'per month',
    perQuarter: 'per quarter',
    perYear: 'per year',
    noIncomeItems: 'No income items yet.',
    noExpenseItems: 'No expense items yet.',
    delete: 'Delete',
    deleting: 'Deleting...',

    // Onboarding
    householdName: 'Household name',
    currency: 'Currency',
    createHousehold: 'Create Household',
    creating: 'Creating...',
    inviteHint: 'You can rename it and invite collaborators anytime from settings.',

    // Theme
    lightTheme: 'Light',
    darkTheme: 'Dark',
  },
  fr: {
    // Nav
    cashFlow: 'Flux de trésorerie',
    transactions: 'Transactions',
    scenarios: 'Scénarios',
    goals: 'Objectifs',
    advisor: 'Conseiller',
    signOut: 'Déconnexion',
    members: 'Membres',

    // View toggle
    yearly: 'Annuel',
    monthly: 'Mensuel',

    // Budget summary cards
    totalIncome: 'Revenus totaux',
    totalExpenses: 'Dépenses totales',
    balance: 'Solde',
    annualProjection: 'Projection annuelle',
    monthlyAverage: 'Moyenne mensuelle',
    surplus: 'Excédent',
    deficit: 'Déficit',

    // Budget item list
    income: 'Revenus',
    expenses: 'Dépenses',
    perMonth: 'par mois',
    perQuarter: 'par trimestre',
    perYear: 'par an',
    noIncomeItems: "Aucun revenu pour l'instant.",
    noExpenseItems: "Aucune dépense pour l'instant.",
    delete: 'Supprimer',
    deleting: 'Suppression...',

    // Onboarding
    householdName: 'Nom du foyer',
    currency: 'Devise',
    createHousehold: 'Créer le foyer',
    creating: 'Création...',
    inviteHint: 'Vous pouvez le renommer et inviter des collaborateurs depuis les paramètres.',

    // Theme
    lightTheme: 'Clair',
    darkTheme: 'Sombre',
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en
