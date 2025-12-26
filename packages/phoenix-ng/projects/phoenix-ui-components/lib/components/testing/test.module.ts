import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/**
 * Minimal test module for UI component tests.
 * Contains only the most basic dependencies needed for testing UI components.
 * Avoids importing heavy modules that cause Angular 20 compatibility issues.
 */
@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class TestModule {}
