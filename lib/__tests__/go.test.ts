import { expect, it } from 'vitest'
import designer1 from './designer-demo1'
import { GeneratorPliginHelper, useGeneratorAgg } from '../domain/generator-agg'
import { GENERATOR_GO_PLUGIN } from '..'
import { go } from '../domain/define'

it('designer1', () => {
  const agg = useGeneratorAgg(designer1)
  GeneratorPliginHelper.registerPlugin(GENERATOR_GO_PLUGIN)
  const context: go.GoContext = {
    additions: new Set([]),
    moduleName: designer1._getContext().getModuleName() || 'test',
    namespace: 'domain',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  // expect(files).toBe(1)
  // expect(files.filter((i) => i.getName().endsWith('order.go'))).toBe(1)
  expect(files.filter((i) => i.getName().endsWith('value_object.go'))).toBe(1)
})
