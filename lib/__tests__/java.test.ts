import { expect, it } from 'vitest'
import designer1 from './designer-demo1'
import { useGeneratorAgg, GENERATOR_JAVA_PLUGIN, GeneratorPliginHelper } from '..'
import { java } from '../domain/define'

it('designer1', () => {
  const agg = useGeneratorAgg(designer1)
  GeneratorPliginHelper.registerPlugin(GENERATOR_JAVA_PLUGIN)
  const context: java.JavaContext = {
    // additions: new Set([java.JavaGeneratorAddition.CommandHandler, java.JavaGeneratorAddition.RecordVakueObject]),
    additions: new Set([java.JavaGeneratorAddition.CommandHandler, java.JavaGeneratorAddition.Lombok]),
    // additions: new Set([java.JavaGeneratorAddition.CommandHandler]),
    moduleName: designer1._getContext().getDesignerOptions().moduleName || 'test',
    namespace: 'com.github.example',
    nonNullAnnotation: 'org.springframework.lang.NonNull',
    nullableAnnotation: 'org.springframework.lang.Nullable',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  // expect(files).toBe(1)
  // expect(files.filter((i) => i.getName().endsWith('Time.java'))).toBe(1)
})

it('designer1-ignoredValueObjects1', () => {
  const agg = useGeneratorAgg(designer1)
  GeneratorPliginHelper.registerPlugin(GENERATOR_JAVA_PLUGIN)
  const context: java.JavaContext = {
    additions: new Set([java.JavaGeneratorAddition.CommandHandler, java.JavaGeneratorAddition.Lombok]),
    moduleName: designer1._getContext().getDesignerOptions().moduleName || 'test',
    namespace: 'com.github.example',
    nonNullAnnotation: 'org.springframework.lang.NonNull',
    nullableAnnotation: 'org.springframework.lang.Nullable',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  expect(files.filter((i) => i.getName() === 'Time.java').length).toBe(0)
  expect(
    files
      .filter((i) => i.getName() === 'DeductFailedEvent.java')[0]
      .getContent()
      .includes('LocalDateTime time')
  ).toBeTruthy()
  expect(
    files
      .filter((i) => i.getName() === 'DeductFailedEvent.java')[0]
      .getContent()
      .includes('import java.time.LocalDateTime')
  ).toBeTruthy()
})
