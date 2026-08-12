export interface PolicyLink {
    key: string;
    labelKey: string;
    url: string;
}

export const POLICY_LINKS: PolicyLink[] = [
    {
        key: "privacy_policy",
        labelKey: "settings.privacy_policy",
        url: "https://sites.google.com/view/sitadairy/privacy-policy?authuser=0",
    },
    {
        key: "terms_conditions",
        labelKey: "settings.terms_conditions",
        url: "https://sites.google.com/view/sitadairy/terms-conditions?authuser=0",
    },
    {
        key: "shipping_policy",
        labelKey: "settings.shipping_policy",
        url: "https://sites.google.com/view/sitadairy/shipping-policy?authuser=0",
    },
    {
        key: "return_policy",
        labelKey: "settings.return_policy",
        url: "https://sites.google.com/view/sitadairy/return-policy?authuser=0",
    },
    {
        key: "refund_policy",
        labelKey: "settings.refund_policy",
        url: "https://sites.google.com/view/sitadairy/refund-policy?authuser=0",
    },
    {
        key: "account_deletion_policy",
        labelKey: "settings.account_deletion_policy",
        url: "https://sites.google.com/view/sitadairy/delete-account?authuser=0",
    },
];
