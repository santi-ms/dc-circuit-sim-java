package com.example.dc.domain;

import java.util.Arrays;

public final class CircuitSpec {
    private final double[][] a;
    private final double[] b;
    private final String name;

    public CircuitSpec(double[][] a, double[] b, String name) {
        this.a = deepCopyMatrix(a);
        this.b = b != null ? b.clone() : null;
        this.name = name;
    }

    public double[][] a() {
        return deepCopyMatrix(a);
    }

    public double[] b() {
        return b.clone();
    }

    public String name() {
        return name;
    }

    public int size() {
        return a.length;
    }

    private static double[][] deepCopyMatrix(double[][] source) {
        if (source == null) {
            return null;
        }
        double[][] copy = new double[source.length][];
        for (int i = 0; i < source.length; i++) {
            copy[i] = source[i] != null ? source[i].clone() : null;
        }
        return copy;
    }

    @Override
    public String toString() {
        return "CircuitSpec{" +
                "name='" + name + '\'' +
                ", size=" + (a != null ? a.length : 0) +
                ", bLength=" + (b != null ? b.length : 0) +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CircuitSpec that = (CircuitSpec) o;
        return Arrays.deepEquals(a, that.a) && Arrays.equals(b, that.b) && name.equals(that.name);
    }

    @Override
    public int hashCode() {
        int result = Arrays.deepHashCode(a);
        result = 31 * result + Arrays.hashCode(b);
        result = 31 * result + name.hashCode();
        return result;
    }
}
