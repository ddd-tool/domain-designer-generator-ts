import { describe, expect, it } from 'vitest'
import designer1 from './designer-demo1'
import { useGeneratorAgg, GENERATOR_JAVA_PLUGIN, GeneratorPliginHelper } from '..'
import { java } from '../domain/define'

it('base testing', () => {
  const agg = useGeneratorAgg(designer1)
  GeneratorPliginHelper.registerPlugin(GENERATOR_JAVA_PLUGIN)
  const context: java.JavaContext = {
    additions: new Set([java.JavaGeneratorAddition.CommandHandler]),
    moduleName: designer1._getContext().getDesignerOptions().moduleName || 'test',
    namespace: 'com.github.example',
    nonNullAnnotation: 'org.springframework.lang.NonNull',
    nullableAnnotation: 'org.springframework.lang.Nullable',
    idGenStrategy: 'SEQUENCE',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  expect(
    files
      .filter((f) => f.getName() === 'CreateOrderCommand.java')[0]
      .getParentDir()
      .find((_, i, arr) => i === arr.length - 1)
  ).toBe('command')
  expect(
    files
      .filter((f) => f.getName() === 'AutoDeductFacadeCommand.java')[0]
      .getParentDir()
      .find((_, i, arr) => i === arr.length - 1)
  ).toBe('command')
  expect(
    files
      .filter((f) => f.getName() === 'OrderId.java')[0]
      .getParentDir()
      .find((_, i, arr) => i === arr.length - 1)
  ).toBe('value')
  expect(
    files
      .filter((f) => f.getName() === 'OrderSucceedEvent.java')[0]
      .getParentDir()
      .find((_, i, arr) => i === arr.length - 1)
  ).toBe('event')
})

enum ExpectType {
  IncludeFile = 'IncludeFile',
  IncludeContent = 'IncludeContent',
  ExcludeFile = 'ExcludeFile',
  ExcludeContent = 'ExcludeContent',
}

const testCases = [
  {
    caseName: 'Timezone',
    additions: new Set([java.JavaGeneratorAddition.CommandHandler, java.JavaGeneratorAddition.Timezone]),
    expect: [
      {
        type: ExpectType.IncludeContent,
        file: 'OrderSucceedEvent.java',
        contents: ['OrderTime orderTime'],
      },
      {
        type: ExpectType.IncludeContent,
        file: 'OrderTime.java',
        contents: ['java.time.OffsetDateTime', 'OffsetDateTime value'],
      },
    ],
  },
  {
    caseName: 'Record',
    additions: new Set([java.JavaGeneratorAddition.CommandHandler, java.JavaGeneratorAddition.RecordValueObject]),
    expect: [
      {
        type: ExpectType.IncludeContent,
        file: 'CreateOrderCommand.java',
        contents: ['record CreateOrderCommand'],
      },
      {
        type: ExpectType.IncludeContent,
        file: 'OrderSucceedEvent.java',
        contents: ['record OrderSucceedEvent'],
      },
      {
        type: ExpectType.IncludeContent,
        file: 'ProductPrice.java',
        contents: ['record ProductPrice'],
      },
    ],
  },
  {
    caseName: 'Lombok',
    additions: new Set([
      java.JavaGeneratorAddition.CommandHandler,
      java.JavaGeneratorAddition.Lombok,
      java.JavaGeneratorAddition.LombokBuilder,
    ]),
    expect: [
      {
        type: ExpectType.IncludeContent,
        file: 'CreateOrderCommand.java',
        contents: ['Builder(toBuilder = true)'],
      },
      {
        type: ExpectType.IncludeContent,
        file: 'OrderSucceedEvent.java',
        contents: ['Builder(toBuilder = true)'],
      },
      {
        type: ExpectType.IncludeContent,
        file: 'OrderAggImpl.java',
        contents: ['@lombok.Getter', '@lombok.AllArgsConstructor'],
      },
    ],
  },
  {
    caseName: 'Spring',
    additions: new Set([java.JavaGeneratorAddition.CommandHandler, java.JavaGeneratorAddition.SpringFramework]),
    expect: [
      {
        type: ExpectType.IncludeContent,
        file: 'CreateOrderCommandHandler.java',
        contents: ['org.springframework.stereotype.Component', 'Component'],
      },
    ],
  },
  {
    caseName: 'Jpa',
    additions: new Set([java.JavaGeneratorAddition.CommandHandler, java.JavaGeneratorAddition.Jpa]),
    expect: [
      { type: ExpectType.IncludeContent, file: 'OrderId.java', contents: ['@Embeddable'] },
      {
        type: ExpectType.IncludeContent,
        file: 'OrderAggImpl.java',
        contents: ['@Entity', '@Table(name = "order_agg")', '@Id', '@Column', 'OrderAggImpl()'],
      },
    ],
  },
  {
    caseName: 'Lombok + Jpa',
    additions: new Set([
      java.JavaGeneratorAddition.CommandHandler,
      java.JavaGeneratorAddition.Jpa,
      java.JavaGeneratorAddition.Lombok,
    ]),
    expect: [
      {
        type: ExpectType.IncludeContent,
        file: 'OrderAggImpl.java',
        contents: ['@lombok.NoArgsConstructor', '@Entity', '@Table(name = "order_agg")', '@Id', '@Column'],
      },
    ],
  },
]

describe.each(testCases)('$caseName', ({ additions, expect: caseExpects }) => {
  const agg = useGeneratorAgg(designer1)
  GeneratorPliginHelper.registerPlugin(GENERATOR_JAVA_PLUGIN)
  const context: java.JavaContext = {
    additions,
    moduleName: designer1._getContext().getDesignerOptions().moduleName || 'test',
    namespace: 'com.github.example',
    nonNullAnnotation: 'org.springframework.lang.NonNull',
    nullableAnnotation: 'org.springframework.lang.Nullable',
    idGenStrategy: 'SEQUENCE',
  }
  agg.commands.setContext(context)
  const files = agg.commands.genCodeFiles()
  for (const currentExpect of caseExpects) {
    it(`type = ${currentExpect.type}, fileName = ${currentExpect.file}`, () => {
      if (currentExpect.type === ExpectType.IncludeFile) {
        expect(files.find((f) => f.getName() === currentExpect.file)).not.toBeUndefined()
      } else if (currentExpect.type === ExpectType.IncludeContent) {
        const f = files.find((f) => f.getName() === currentExpect.file)
        expect(f).not.toBeUndefined()
        for (const content of currentExpect.contents) {
          expect(f!.getContent()).includes(content)
        }
      } else if (currentExpect.type === ExpectType.ExcludeFile) {
        expect(files.find((f) => f.getName() === currentExpect.file)).toBeUndefined()
      } else if (currentExpect.type === ExpectType.ExcludeContent) {
        const f = files.find((f) => f.getName() === currentExpect.file)
        expect(f).not.toBeUndefined()
        for (const content of currentExpect.contents) {
          expect(!f!.getContent()).includes(content)
        }
      } else {
        isNever(currentExpect.type)
      }
    })
  }
})
