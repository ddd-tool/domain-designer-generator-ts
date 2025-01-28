import { expect, it } from 'vitest'
import { GeneratorPliginHelper, useGeneratorAgg } from '../domain/generator-agg'
import designer1 from './designer-demo1'
import { csharp } from '../domain/define'
import { GENERATOR_CSHARP_PLUGIN } from '..'

it('designer1', () => {
  const agg = useGeneratorAgg(designer1)
  GeneratorPliginHelper.registerPlugin(GENERATOR_CSHARP_PLUGIN)
  const context: csharp.CSharpContext = {
    additions: new Set([
      // csharp.CSharpGeneratorAddition.PrimaryConstructor,
      // csharp.CSharpGeneratorAddition.AggInterface,
    ]),
    moduleName: designer1._getContext().getModuleName() || 'User',
    namespace: 'Application.Domain',
    aggInterface: 'MyAgg',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  // expect(files).toBe(1)
  // expect(files.filter((i) => i.getName().endsWith('Event.cs'))).toBe(1)
})
