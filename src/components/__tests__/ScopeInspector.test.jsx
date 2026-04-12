import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScopeInspector from '../Intel/ScopeInspector';
import useExecutionStore from '../../store/useExecutionStore';

beforeEach(() => {
  useExecutionStore.getState().resetExecution();
});

describe('ScopeInspector', () => {
  it('renders header', () => {
    render(<ScopeInspector />);
    expect(screen.getByText('Scope Tree')).toBeInTheDocument();
  });

  it('shows "Global Scope" for root', () => {
    render(<ScopeInspector />);
    expect(screen.getByText('Global Scope')).toBeInTheDocument();
  });

  it('shows placeholder when no variables or children', () => {
    render(<ScopeInspector />);
    expect(screen.getByText('Run code to inspect scopes')).toBeInTheDocument();
  });

  it('renders variables in global scope', () => {
    useExecutionStore.getState().setScopeTree({
      name: 'Global',
      type: 'global',
      variables: {
        x: { name: 'x', value: '42', type: 'number' },
        msg: { name: 'msg', value: "'hello'", type: 'string' },
      },
      children: [],
    });
    render(<ScopeInspector />);
    expect(screen.getByText('x')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('number')).toBeInTheDocument();
    expect(screen.getByText('msg')).toBeInTheDocument();
    expect(screen.getByText("'hello'")).toBeInTheDocument();
    expect(screen.getByText('string')).toBeInTheDocument();
  });

  it('renders child scopes with function names', () => {
    useExecutionStore.getState().setScopeTree({
      name: 'Global',
      type: 'global',
      variables: {},
      children: [
        {
          name: 'myFunc',
          type: 'function',
          variables: {
            a: { name: 'a', value: '10', type: 'number' },
          },
          children: [],
        },
      ],
    });
    render(<ScopeInspector />);
    expect(screen.getByText('myFunc()')).toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('hides placeholder when variables exist', () => {
    useExecutionStore.getState().setScopeTree({
      name: 'Global',
      type: 'global',
      variables: { x: { name: 'x', value: '1', type: 'number' } },
      children: [],
    });
    render(<ScopeInspector />);
    expect(screen.queryByText('Run code to inspect scopes')).not.toBeInTheDocument();
  });

  it('hides placeholder when children exist', () => {
    useExecutionStore.getState().setScopeTree({
      name: 'Global',
      type: 'global',
      variables: {},
      children: [{ name: 'func', type: 'function', variables: {}, children: [] }],
    });
    render(<ScopeInspector />);
    expect(screen.queryByText('Run code to inspect scopes')).not.toBeInTheDocument();
  });

  it('renders nested scopes', () => {
    useExecutionStore.getState().setScopeTree({
      name: 'Global',
      type: 'global',
      variables: {},
      children: [
        {
          name: 'outer',
          type: 'function',
          variables: {},
          children: [
            {
              name: 'inner',
              type: 'function',
              variables: { y: { name: 'y', value: '99', type: 'number' } },
              children: [],
            },
          ],
        },
      ],
    });
    render(<ScopeInspector />);
    expect(screen.getByText('outer()')).toBeInTheDocument();
    expect(screen.getByText('inner()')).toBeInTheDocument();
    expect(screen.getByText('y')).toBeInTheDocument();
  });

  it('displays type badges with correct labels', () => {
    useExecutionStore.getState().setScopeTree({
      name: 'Global',
      type: 'global',
      variables: {
        s: { name: 's', value: "'text'", type: 'string' },
        n: { name: 'n', value: '3.14', type: 'number' },
        b: { name: 'b', value: 'true', type: 'boolean' },
        a: { name: 'a', value: '[1,2]', type: 'array' },
      },
      children: [],
    });
    render(<ScopeInspector />);
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByText('number')).toBeInTheDocument();
    expect(screen.getByText('boolean')).toBeInTheDocument();
    expect(screen.getByText('array')).toBeInTheDocument();
  });

  it('displays closure badge when variable has isClosure flag', () => {
    useExecutionStore.getState().setScopeTree({
      name: 'Global',
      type: 'global',
      variables: {
        count: { name: 'count', value: '0', type: 'number', isClosure: true },
      },
      children: [],
    });
    render(<ScopeInspector />);
    expect(screen.getByText('Closure')).toBeInTheDocument();
  });
});
