module.exports = {
    installMsaModule: async itf => {
        await require("./install")(itf)
    },
    ...require("./param"),
    ...require("./admin")
}
