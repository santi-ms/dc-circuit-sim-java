install:
	./gradlew build

run:
	./gradlew bootRun

test:
	./gradlew test

bench:
	bash scripts/bench_run.sh

monitor:
	bash scripts/monitoreo.sh
