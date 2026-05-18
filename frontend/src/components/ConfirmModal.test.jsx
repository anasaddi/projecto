import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmModal } from './ConfirmModal'

describe('ConfirmModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <ConfirmModal open={false} title="Test" message="Msg" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders title and message when open', () => {
    render(
      <ConfirmModal open title="Elimina" message="Sei sicuro?" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(screen.getByRole('dialog', { name: /elimina/i })).toBeInTheDocument()
    expect(screen.getByText('Sei sicuro?')).toBeInTheDocument()
  })

  it('calls onConfirm when Confirm is clicked', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmModal open title="Test" message="Msg" onConfirm={onConfirm} onCancel={onCancel} />
    )
    fireEvent.click(screen.getByRole('button', { name: /conferma/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(0)
  })

  it('calls onCancel when Annulla is clicked', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmModal open title="Test" message="Msg" onConfirm={() => {}} onCancel={onCancel} />
    )
    fireEvent.click(screen.getByRole('button', { name: /annulla/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
