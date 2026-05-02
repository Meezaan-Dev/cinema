import { StatusState } from './StatusState'

type EmptyStateProps = {
    title: string
    message: string
}

export function EmptyState({ title, message }: EmptyStateProps) {
    return <StatusState title={title} message={message} />
}
