import { Injectable } from '@angular/core';
import { WhiteboardElement } from '../models/white-board.model';

export type ActionType = 'add' | 'remove';

export interface HistoryAction {
  type: ActionType;
  element: WhiteboardElement; // The item being added/removed
  index?: number;             // Where it was (used for undoing deletion)
}

@Injectable({
  providedIn: 'root'
})
export class HistoryManager {
  private undoStack: HistoryAction[] = [];
  private redoStack: HistoryAction[] = [];

  track(action: HistoryAction) {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo stack on new interaction
  }

  undo(currentElements: WhiteboardElement[]): WhiteboardElement[] {
    if (this.undoStack.length === 0) return currentElements;

    const action = this.undoStack.pop()!;
    this.redoStack.push(action);

    // If action was 'add', to undo it, we must 'remove' it.
    // If action was 'remove', to undo it, we must 'add' it back.
    if (action.type === 'add') {
      // Inverse: Remove the element
      return currentElements.filter(el => el !== action.element);
    } 
    else {
      // Inverse: Add the element back (at its original position)
      const newElements = [...currentElements];
      // If index is valid, insert there, otherwise push to end
      const insertIndex = (action.index !== undefined) ? action.index : newElements.length;
      newElements.splice(insertIndex, 0, action.element);
      return newElements;
    }
  }

  redo(currentElements: WhiteboardElement[]): WhiteboardElement[] {
    if (this.redoStack.length === 0) return currentElements;

    const action = this.redoStack.pop()!;
    this.undoStack.push(action);

    if (action.type === 'add') {
      return [...currentElements, action.element];
    } 
    else {
      return currentElements.filter(el => el !== action.element);
    }
  }
}