
export default class Tree<T, C> {
  content: C;
  children: Map<T, Tree<T, C>>;

  constructor() {
    this.children = new Map<T, Tree<T, C>>();
  };

  public traverse(keys: T[]): C {
    let subtree: Tree<T, C> = this.children.get(keys.shift());
    if(subtree === undefined) {
      return this.content;
    }
    else {
      return subtree.traverse(keys);
    }
  }

  public insert(keys: T[], value: C): void {
    if(keys.length == 0) {
      this.content = value;
    }
    else {
      let key = keys.shift();
      let subtree: Tree<T, C> = this.children.get(key);
      if(subtree === undefined) {
        let newSubtree: Tree<T, C> = new Tree<T, C>();
        this.children.set(key, newSubtree);
        newSubtree.insert(keys, value);
      }
      else {
        subtree.insert(keys, value);
      }
    }
  }
}
