import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { Award, CheckCircle2, Download } from 'lucide-react'
import { TestTimer } from '../../components/worker/TestTimer'
import { getCertifications, getTests, startTestAttempt, submitTestAttempt, type WorkerTest, workerKeys } from '../../api/worker'
import { useToast } from '../../components/ui/toastStore'
import { Card, SectionHeader, SkeletonBlock, WorkerPageTitle, dateShort, money } from './workerUtils'

const questions = [
  { text: 'Which approach best supports maintainable delivery?', options: ['Clear scope notes', 'Hidden assumptions', 'Skipped QA', 'Untracked changes'] },
  { text: 'What should you do when blocked?', options: ['Raise it early', 'Wait silently', 'Contact client', 'Rewrite scope'] },
  { text: 'What belongs in Bridgr workspaces?', options: ['Admin/team updates', 'Client contacts', 'Original budgets', 'Private client details'] },
]

export const WorkerTestsPage = () => {
  const [activeTest, setActiveTest] = useState<WorkerTest | null>(null)
  const [attemptId, setAttemptId] = useState('')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)
  const { notify } = useToast()
  const tests = useQuery({ queryKey: workerKeys.tests(), queryFn: getTests })
  const certs = useQuery({ queryKey: workerKeys.certifications(), queryFn: getCertifications })
  const startMutation = useMutation({ mutationFn: (id: string) => startTestAttempt(id), onSuccess: (data) => setAttemptId(data.attemptId) })
  const submitMutation = useMutation({
    mutationFn: () => submitTestAttempt(activeTest?.id || '', attemptId, {}),
    onSuccess: (data) => {
      setResult(data)
      notify({ kind: data.passed ? 'success' : 'error', title: data.passed ? 'Certification issued' : 'Attempt submitted', message: `Score: ${data.score}%` })
    },
  })

  const start = (test: WorkerTest) => {
    if (test.fee > 0 && !window.confirm(`Pay ${money(test.fee)} to start this test?`)) return
    setActiveTest(test)
    setQuestionIndex(0)
    setResult(null)
    startMutation.mutate(test.id)
  }

  return (
    <div className="space-y-6">
      <WorkerPageTitle title="Skill Tests" subtitle="Earn certifications that improve matching priority." />
      <Card>
        <SectionHeader title="Available Tests" />
        {tests.isLoading ? <SkeletonBlock className="m-5 h-48" /> : (
          <div className="grid gap-5 p-5 lg:grid-cols-3">
            {tests.data?.map((test) => (
              <article key={test.id} className="rounded-lg border border-border bg-surface p-5">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-navy">{test.name}</h3>
                  <span className="rounded-full bg-blue-tint px-2.5 py-1 text-xs font-bold text-blue">{test.category}</span>
                </div>
                <p className="mt-3 text-sm text-muted">{test.questions} questions · {test.timeLimit} min · {test.passingScore}% pass</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full bg-amber-tint px-3 py-1 text-xs font-bold text-amber">{test.fee ? money(test.fee) : 'Free'}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-success"><Award className="h-4 w-4" /> Badge</span>
                </div>
                {test.cooldownDays ? <p className="mt-3 text-xs font-bold text-error">Retake available in {test.cooldownDays} days</p> : <button onClick={() => start(test)} className="mt-5 w-full rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">Start Test</button>}
              </article>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <SectionHeader title="My Certifications" />
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {certs.data?.map((cert) => (
            <article key={cert.id} className="rounded-lg border border-border p-4">
              <h3 className="flex items-center gap-2 font-bold text-navy"><CheckCircle2 className="h-5 w-5 text-success" /> {cert.name}</h3>
              <p className="mt-2 text-sm text-muted">Issued {dateShort(cert.issuedDate)} · Score {cert.score}% {cert.expiry ? `· Expires ${dateShort(cert.expiry)}` : ''}</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-blue"><Download className="h-4 w-4" /> Download PDF</button>
            </article>
          ))}
        </div>
      </Card>

      <Dialog.Root open={!!activeTest} onOpenChange={(open) => !open && setActiveTest(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/70" />
          <Dialog.Content className="fixed inset-4 z-50 overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            {activeTest && (
              result ? (
                <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
                  <CheckCircle2 className={`h-16 w-16 ${result.passed ? 'text-success' : 'text-error'}`} />
                  <h2 className="mt-5 text-2xl font-bold text-navy">{result.passed ? 'Passed' : 'Submitted'}</h2>
                  <p className="mt-2 text-muted">Score: {result.score}%</p>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <h2 className="text-xl font-bold text-navy">{activeTest.name}</h2>
                    <div className="flex items-center gap-3">
                      <TestTimer timeLimit={activeTest.timeLimit} onSubmit={() => submitMutation.mutate()} />
                    </div>
                  </div>
                  <div className="py-10">
                    <p className="text-sm font-bold uppercase text-muted">Question {questionIndex + 1} of {questions.length}</p>
                    <h3 className="mt-3 text-2xl font-bold text-navy">{questions[questionIndex].text}</h3>
                    <div className="mt-6 space-y-3">
                      {questions[questionIndex].options.map((option) => <label key={option} className="block rounded-lg border border-border p-4 text-sm font-semibold text-ink"><input type="radio" name="answer" className="mr-3" /> {option}</label>)}
                    </div>
                  </div>
                  <button onClick={() => questionIndex === questions.length - 1 ? submitMutation.mutate() : setQuestionIndex((value) => value + 1)} className="rounded-md bg-blue px-5 py-3 text-sm font-bold text-white">
                    {questionIndex === questions.length - 1 ? 'Submit' : 'Next'}
                  </button>
                </div>
              )
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
