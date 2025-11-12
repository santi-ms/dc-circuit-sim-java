package com.example.dc.schedulers;

import java.util.List;

public interface IScheduler {
    void submit(Job job);

    List<Result> runAll();

    String name();
}
