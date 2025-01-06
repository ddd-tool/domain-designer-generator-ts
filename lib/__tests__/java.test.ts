import { expect, it } from 'vitest'
import designer1 from './designer-demo1'
import designer2 from './designer-demo2'
import designer3 from './designer-demo3'
import { useGeneratorAgg, GENERATOR_JAVA_PLUGIN, GeneratorPliginHelper } from '..'
import { java } from '../domain/define'

it('designer1', () => {
  // const agg = useGeneratorAgg(designer1)
  // GeneratorPliginHelper.registerPlugin(GENERATOR_JAVA_PLUGIN)
  // const context: java.JavaContext = {
  //   additions: new Set([java.JavaGeneratorAddition.Lombok]),
  //   moduleName: 'test',
  //   namespace: 'com.example',
  //   nonNullAnnotation: 'org.springframework.lang.NonNull',
  //   nullableAnnotation: 'org.springframework.lang.Nullable',
  // }
  // agg.commands.setContext(context)
  // const files = agg.commands.genCodeFiles()
  // expect(files).toBe(1)
  // expect(files.filter((i) => i.getName().endsWith('Aggregation.java'))).toBe(1)
})

it('designer2', () => {
  // const agg = useGeneratorAgg(designer2)
  // GeneratorPliginHelper.registerPlugin(GENERATOR_JAVA_PLUGIN)
  // const context: java.JavaContext = {
  //   additions: new Set([java.JavaGeneratorAddition.Lombok]),
  //   moduleName: 'test',
  //   namespace: 'com.example',
  //   nonNullAnnotation: 'org.springframework.lang.NonNull',
  //   nullableAnnotation: 'org.springframework.lang.Nullable',
  // }
  // agg.commands.setContext(context)
  // const files = agg.commands.genCodeFiles()
  // // expect(files).toBe(1)
  // expect(files.filter((i) => i.getName().endsWith('命令.java'))).toBe(1)
})

it('designer3', () => {
  const agg = useGeneratorAgg(designer3)
  GeneratorPliginHelper.registerPlugin(GENERATOR_JAVA_PLUGIN)
  const context: java.JavaContext = {
    // additions: new Set([java.JavaGeneratorAddition.CommandHandler,java.JavaGeneratorAddition.RecordVakueObject]),
    additions: new Set([java.JavaGeneratorAddition.CommandHandler, java.JavaGeneratorAddition.Lombok]),
    // additions: new Set([java.JavaGeneratorAddition.CommandHandler]),
    moduleName: 'test',
    namespace: 'com.example',
    nonNullAnnotation: 'org.springframework.lang.NonNull',
    nullableAnnotation: 'org.springframework.lang.Nullable',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  // expect(files).toBe(1)
  expect(files.filter((i) => i.getName().endsWith('CreateOrderHandler.java'))).toBe(1)
})
