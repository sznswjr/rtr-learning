export function createGpuTimer(gl) {
  const extension = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  const pending = [];
  let activeQuery = null;

  return {
    available: Boolean(extension),
    begin(label = "frame") {
      if (!extension || activeQuery) {
        return false;
      }
      activeQuery = { label, query: gl.createQuery() };
      gl.beginQuery(extension.TIME_ELAPSED_EXT, activeQuery.query);
      return true;
    },
    dispose() {
      if (activeQuery) {
        gl.deleteQuery(activeQuery.query);
        activeQuery = null;
      }
      pending.splice(0).forEach(({ query }) => gl.deleteQuery(query));
    },
    end() {
      if (!extension || !activeQuery) {
        return false;
      }
      gl.endQuery(extension.TIME_ELAPSED_EXT);
      pending.push(activeQuery);
      activeQuery = null;
      return true;
    },
    poll() {
      if (!extension || pending.length === 0) {
        return null;
      }
      const current = pending[0];
      const ready = gl.getQueryParameter(current.query, gl.QUERY_RESULT_AVAILABLE);
      const disjoint = gl.getParameter(extension.GPU_DISJOINT_EXT);
      if (!ready) {
        return null;
      }
      pending.shift();
      const nanoseconds = gl.getQueryParameter(current.query, gl.QUERY_RESULT);
      gl.deleteQuery(current.query);
      return {
        disjoint,
        label: current.label,
        milliseconds: disjoint ? null : nanoseconds / 1_000_000,
      };
    },
  };
}
