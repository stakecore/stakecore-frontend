export const menuList = [
    {
        id: 1,
        path: "/",
        label: "home"
    },
    {
        id: 2,
        path: "/about",
        label: "about"
    },
/*     {
        id: 3,
        path: "/service",
        label: "service"
    }, */
    {
        id: 4,
        label: "protocols",
        children: [
            { id: 41, path: "/flare/validator", label: "Flare Validator" },
            { id: 42, path: "/flare/fsp", label: "Flare FSP" },
            { id: 43, path: "/songbird/fsp", label: "Songbird FSP" },
            { id: 44, path: "/avalanche/validator", label: "Avalanche Validator" },
        ],
    },
    {
        id: 5,
        path: "/contact",
        label: "contact"
    },

]