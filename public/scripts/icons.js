export const paymentTokensDict = {
    'POL': {
        "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359": "https://bafybeiag2css4im6d7fdtcafwabw2qau46yrzhn4z23hwhsft2e3faa2fy.ipfs.w3s.link/USDC_of_the_future.png", // USDC
        "0x81ccef6414d4cdbed9fd6ea98c2d00105800cd78": "https://bafybeigr6ri2ythjbciusgjdvimjt74caymflc5ut4rmtrkhcoi2cr53ua.ipfs.w3s.link/DecentSmartHome.png", // SHT
        "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270": "https://bafybeic5bvnkjejuxbogn2n7lyzfyf5l6glgzrxkidjwj4yvhyci5haoca.ipfs.w3s.link/PolygonLogo.png", // MATIC
    },
    'MintMe': {
        "0x969d65ee0823f9c892bdfe3c462d91ab1d278b4e": "/assets/DecentSmartHome_Logo.png", // DecentSmartHomes
        "0x25396c06fEf8b79109da2a8e237c716e202489EC": "/assets/MTCG_Logo.png", // MTCG
        "0x2f9C7A6ff391d0b6D5105F8e37F2050649482c75": "/assets/Bobdubbloon_Logo.png", // Bobdubbloon
    }
};


export const loadIcons = async (paymentTokens) => {
    const tokenAddresses = paymentTokens
        .map((token) => {
            if (!token || typeof token !== "string") {
                console.warn(`Invalid token address: ${token}`);
                return null; // Mark invalid tokens
            }
            return token;
        })
        .filter(Boolean); // Remove null entries

    const fetchedIcons = await Promise.all(

        tokenAddresses.map(async (token) => {
            const url = paymentTokensDict.POL[token] || paymentTokensDict.MintMe[token]; // Check both networks
            if (!url) {
                console.warn(`Icon not found for token ${token}. Using fallback.`);
                return { token, url: "https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif" }; // Fallback icon
            }

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
                return { token, url };
            } catch (error) {
                console.error(`Error fetching icon for ${token}:`, error);
                return { token, url: "https://bafybeifej4defs5s5wryxylmps42c7xkbzle3fxjgnsbb5hcfnd5b77zwa.ipfs.w3s.link/Ens_Eth_Breathe.gif" }; // Fallback icon
            }
        })
    );

    return fetchedIcons;
};