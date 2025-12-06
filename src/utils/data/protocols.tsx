import avalancheValidatorThumbnail from "../../assets/images/protocols/avalanche/validator/thumbnail.webp"
import flareValidatorThumbnail from "../../assets/images/protocols/flare/validator/thumbnail.png"
import flareFspThumbnail from "../../assets/images/protocols/flare/fsp/thumbnail.png"
import songbirdFspThumbnail from "../../assets/images/protocols/songbird/fsp/thumbnail.svg"

// 1920 x 1249
export const protocolsData = [
    {
        id: 1,
        category: "Flare",
        title: "Validator",
        href: '/flare/validator',
        src: flareValidatorThumbnail
    },
    {
        id: 2,
        category: "Flare",
        title: "FSP",
        href: '/flare/fsp',
        src: flareFspThumbnail
    },
    {
        id: 3,
        category: "Songbird",
        title: "FSP",
        href: "/songbird/fsp",
        src: songbirdFspThumbnail
    },
    {
        id: 4,
        category: "Avalanche",
        title: "Validator",
        href: '/avalanche/validator',
        src: avalancheValidatorThumbnail
    }
]