package com.example.dc.schedulers;

public interface StepRunner {
    boolean isFinished();

    /**
     * Ejecuta el siguiente paso de la tarea.
     * @return tiempo estimado en milisegundos consumidos por el paso.
     */
    long runNextStep();

    double[] currentResult();
}
