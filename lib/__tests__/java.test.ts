import { expect, it } from 'vitest'
import designer1 from './designer-demo1'
import { useGeneratorAgg, GENERATOR_JAVA_PLUGIN, GeneratorPliginHelper } from '..'
import { JavaContext, JavaGeneratorAddition } from '../domain/define'

it('', () => {
  const agg = useGeneratorAgg(designer1)
  GeneratorPliginHelper.registerPlugin(GENERATOR_JAVA_PLUGIN)
  const context: JavaContext = {
    additions: new Set([JavaGeneratorAddition.Lombok]),
    moduleName: 'test',
    namespace: 'com.example',
    nonNullAnnotation: 'org.springframework.lang.NonNull',
    nullableAnnotation: 'org.springframework.lang.Nullable',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  expect(files).toBe(1)
  // expect(files.filter((i) => i.getName().endsWith('Aggregation.java'))).toBe(1)
})
