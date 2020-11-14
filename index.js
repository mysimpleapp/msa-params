module.exports = {
    startMsaModule: async itf => {
        return await require("./start")(itf)
    },
    ...require("./param"),
    ...require("./admin")
}
