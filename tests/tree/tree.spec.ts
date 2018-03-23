import Tree from '../../src/data_structures/Tree';
import { expect } from 'chai';
import 'mocha';

describe('Tree tests', () => {
  it('Tree creation', () => {
    const tree: Tree<string, string> = new Tree<string, string>();
    expect(tree).not.null;
  });
  it('Tree insertion', () => {
    const tree: Tree<string, string> = new Tree<string, string>();
    tree.insert([], "hello");
  });
  it('Tree traversal', () => {
    const tree: Tree<string, string> = new Tree<string, string>();
    tree.insert([], "hello");
    expect(tree.traverse([])).to.equal('hello');
  });
  it('Tree deep traversal', () => {
    const tree: Tree<string, string> = new Tree<string, string>();
    tree.insert([], "GET_HELP");
    tree.insert(["inhouse"], "GET_LEAGUE");
    tree.insert(["inhouse", "profile"], "GET_PROFILE");
    tree.insert(["inhouse", "stats"], "GET_STATS");
    expect(tree.traverse([])).to.equal('GET_HELP');
    expect(tree.traverse(["inhouse"])).to.equal('GET_LEAGUE');
    expect(tree.traverse(["inhouse", "profile"])).to.equal('GET_PROFILE');
    expect(tree.traverse(["inhouse", "stats"])).to.equal('GET_STATS');
  });
  it('Premature stop', () => {
    const tree: Tree<string, string> = new Tree<string, string>();
    tree.insert([], "GET_HELP");
    tree.insert(["inhouse"], "GET_LEAGUE");
    tree.insert(["inhouse", "profile"], "GET_PROFILE");
    expect(tree.traverse([])).to.equal('GET_HELP');
    expect(tree.traverse(["inhouse"])).to.equal('GET_LEAGUE');
    expect(tree.traverse(["inhouse", "profile"])).to.equal('GET_PROFILE');
    expect(tree.traverse(["inhouse", "bats"])).to.equal('GET_LEAGUE');
    expect(tree.traverse(["not", "there"])).to.equal('GET_HELP');
  });
});
