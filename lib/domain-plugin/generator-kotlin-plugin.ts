import { GeneratorPliginHelper } from '../domain/generator-agg'

export default GeneratorPliginHelper.createHotSwapPlugin(() => {
  return {
    unmount({ api }) {
      api.commands.clearCaches()
      api.commands._setCommandCodeProvider(() => [])
      api.commands._setFacadeCommandCodeProvider(() => [])
      api.commands._setAggCodeProvider(() => [])
      api.commands._setEventCodeProvider(() => [])
      api.commands._setReadModelCodeProvider(() => [])
      api.commands._setCodeFileProvider(() => [])
      api.commands.setContext({} as any)
    },
    mount() {
      // TODO
    },
  }
})
