package com.school.dashboard;

import de.sematre.dsbmobile.DSBMobile;
import de.sematre.dsbmobile.DSBMobile.TimeTable;

import java.util.List;

public class Main {
    public static void main(String[] args) {
        if (args.length != 2) {
            System.err.println("Usage: java -jar dsb-backend.jar <username> <password>");
            System.exit(1);
        }
        DSBMobile client = new DSBMobile(args[0], args[1]);
        List<TimeTable> plans = client.getTimeTables();
        plans.forEach(System.out::println);
    }
}
