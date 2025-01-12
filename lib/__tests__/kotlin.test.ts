import { expect, it } from 'vitest'
import designer1 from './designer-demo1'
import { useGeneratorAgg, GENERATOR_KOTLIN_PLUGIN, GeneratorPliginHelper } from '..'
import { kotlin } from '../domain/define'

it('designer1', () => {
  const agg = useGeneratorAgg(designer1)
  GeneratorPliginHelper.registerPlugin(GENERATOR_KOTLIN_PLUGIN)
  const context: kotlin.KotlinContext = {
    // additions: new Set([kotlin.KotlinGeneratorAddition.CommandHandler, kotlin.KotlinGeneratorAddition.ValueClass]),
    additions: new Set([kotlin.KotlinGeneratorAddition.CommandHandler]),
    moduleName: designer1._getContext().getModuleName() || 'test',
    namespace: 'com.github.example',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  // expect(files).toBe(1)
  // expect(files.filter((i) => i.getName().endsWith('Agg.kt'))).toBe(1)
})
