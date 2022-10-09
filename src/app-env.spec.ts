describe('AppController (e2e)', () => {
  it('Check env', () => {
    expect(process.env.OPTIMISM_URL).toBeTruthy();
    expect(process.env.POLYGON_URL).toBeTruthy();
  });
});
