import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Sentry Integration', () => {
  it('should have @sentry/react installed', () => {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    expect(packageJson.dependencies['@sentry/react']).toBeDefined();
  });

  it('should have Sentry initialized in main.tsx', () => {
    const mainTsxPath = path.join(__dirname, '..', 'client', 'src', 'main.tsx');
    const mainTsxContent = fs.readFileSync(mainTsxPath, 'utf-8');
    
    // Check for Sentry import
    expect(mainTsxContent).toContain('import * as Sentry from "@sentry/react"');
    
    // Check for Sentry.init call
    expect(mainTsxContent).toContain('Sentry.init({');
    
    // Check for DSN configuration
    expect(mainTsxContent).toContain('dsn:');
    
    // Check for ErrorBoundary wrapper
    expect(mainTsxContent).toContain('Sentry.ErrorBoundary');
  });

  it('should only enable Sentry in production', () => {
    const mainTsxPath = path.join(__dirname, '..', 'client', 'src', 'main.tsx');
    const mainTsxContent = fs.readFileSync(mainTsxPath, 'utf-8');
    
    // Check that Sentry is conditionally enabled
    expect(mainTsxContent).toContain('enabled: import.meta.env.PROD');
  });

  it('should have sendDefaultPii configured', () => {
    const mainTsxPath = path.join(__dirname, '..', 'client', 'src', 'main.tsx');
    const mainTsxContent = fs.readFileSync(mainTsxPath, 'utf-8');
    
    expect(mainTsxContent).toContain('sendDefaultPii: true');
  });

  it('should have tracesSampleRate configured for performance monitoring', () => {
    const mainTsxPath = path.join(__dirname, '..', 'client', 'src', 'main.tsx');
    const mainTsxContent = fs.readFileSync(mainTsxPath, 'utf-8');
    
    expect(mainTsxContent).toContain('tracesSampleRate:');
  });
});
