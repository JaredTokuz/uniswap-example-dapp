describe('Makes sure the environment contains all Vars', () => {
  it('Check env', () => {
    expect(process.env.OPTIMISM_URL).toBeTruthy();
    expect(process.env.POLYGON_URL).toBeTruthy();
  });
});
