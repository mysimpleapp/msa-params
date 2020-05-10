module.exports = {
    installMsaModule: async itf => {
        await require("./install")(itf)
    },
    startMsaModule: async itf => {
        return await require("./start")(itf)
    },
    ...require("./param"),
    ...require("./admin")
}
